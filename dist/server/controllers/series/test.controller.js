import moment from "moment";
import Series from '../../models/series/series.js';
import Attempt from '../../models/series/TestAttempt.js';
import Test from '../../models/series/test.js';
import Enrollment from '../../models/series/enrollments.js';
// Get Test Details for Starting
const getTestDetails = async (req, res) => {
    var _a, _b;
    try {
        const studentId = req.user.id;
        const { testId } = req.params;
        // Get test details
        const test = await Test.findById(testId)
            .populate({
            path: "seriesId",
            select: "title",
        })
            .populate({
            path: "questions.questionId",
            select: "question options correctOption subject difficulty imageUrl questionImg explain info",
        });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        if (!test.isPublished) {
            return res.status(403).json({
                success: false,
                message: "Test is not available",
            });
        }
        // Check if student is enrolled in the series
        const enrollment = await Enrollment.findOne({
            userId: studentId,
            seriesId: test.seriesId._id,
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this series",
            });
        }
        // Check if enrollment is expired
        if (enrollment.expiresAt && moment().isAfter(enrollment.expiresAt)) {
            return res.status(403).json({
                success: false,
                message: "Your enrollment has expired",
            });
        }
        // Check test availability
        const now = moment();
        if (((_a = test.availability) === null || _a === void 0 ? void 0 : _a.startAt) && now.isBefore(test.availability.startAt)) {
            return res.status(403).json({
                success: false,
                message: "Test is not yet available",
                availableAt: test.availability.startAt,
            });
        }
        if (((_b = test.availability) === null || _b === void 0 ? void 0 : _b.endAt) && now.isAfter(test.availability.endAt)) {
            return res.status(403).json({
                success: false,
                message: "Test availability has expired",
            });
        }
        // Check if student has already attempted this test
        const existingAttempts = await Attempt.find({
            studentId: studentId,
            testId: testId,
        }).sort({ attemptNumber: -1 });
        // Check if user has reached maximum attempts (2)
        if (existingAttempts.length >= 2) {
            const bestAttempt = existingAttempts.reduce((best, current) => (current.score > best.score ? current : best));
            return res.status(400).json({
                success: false,
                message: "You have reached the maximum number of attempts for this test",
                attempts: existingAttempts.map((attempt) => ({
                    attemptNumber: attempt.attemptNumber,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                    attemptedAt: attempt.attemptedAt,
                    duration: attempt.duration,
                })),
                bestScore: {
                    score: bestAttempt.score,
                    percentage: Math.round((bestAttempt.score / bestAttempt.totalQuestions) * 100),
                    attemptNumber: bestAttempt.attemptNumber,
                },
            });
        }
        // If user has one attempt, this will be a reattempt
        const isReattempt = existingAttempts.length === 1;
        const nextAttemptNumber = existingAttempts.length + 1;
        // Return test details without correct answers
        const testData = {
            _id: test._id,
            title: test.title,
            description: test.description,
            subjects: test.subjects,
            mode: test.mode,
            durationMin: test.durationMin,
            totalMarks: test.totalMarks,
            totalQuestions: test.questions.length,
            series: test.seriesId,
            isReattempt: isReattempt,
            attemptNumber: nextAttemptNumber,
            previousAttempts: existingAttempts.map((attempt) => ({
                attemptNumber: attempt.attemptNumber,
                score: attempt.score,
                percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                attemptedAt: attempt.attemptedAt,
            })),
            questions: test.questions.map((q, index) => ({
                _id: q.questionId._id,
                questionNumber: index + 1,
                question: q.questionId.question,
                options: q.questionId.options,
                correctOption: q.questionId.correctOption,
                subject: q.questionId.subject,
                difficulty: q.questionId.difficulty,
                imageUrl: q.questionId.imageUrl,
                questionImg: q.questionId.questionImg,
                explain: q.questionId.explain,
                info: q.questionId.info,
                marks: q.marks,
            })),
        };
        res.json({
            success: true,
            test: testData,
        });
    }
    catch (error) {
        console.error("Get test details error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load test details",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Submit Test Attempt
const submitTestAttempt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { testId } = req.params;
        const { answers, duration } = req.body;
        // Validate request body
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers are required and must be an array",
            });
        }
        // Get test details with questions
        const test = await Test.findById(testId).populate({
            path: "questions.questionId",
            select: "correctOption",
        });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        // Check if student is enrolled
        const enrollment = await Enrollment.findOne({
            userId: studentId,
            seriesId: test.seriesId,
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this series",
            });
        }
        // Check if already attempted
        const existingAttempts = await Attempt.find({
            studentId: studentId,
            testId: testId,
        }).sort({ attemptNumber: -1 });
        if (existingAttempts.length >= 2) {
            return res.status(400).json({
                success: false,
                message: "You have reached the maximum number of attempts for this test",
            });
        }
        const attemptNumber = existingAttempts.length + 1;
        const isReattempt = attemptNumber > 1;
        // Process answers and calculate score
        let score = 0;
        const processedAnswers = [];
        for (const answer of answers) {
            const questionIndex = test.questions.findIndex((q) => q.questionId._id.toString() === answer._id);
            if (questionIndex !== -1) {
                const question = test.questions[questionIndex];
                const isCorrect = question.questionId.correctOption === answer.selected;
                if (isCorrect) {
                    score += question.marks || 1;
                }
                processedAnswers.push({
                    questionId: answer._id,
                    selectedOption: answer.selected,
                    isCorrect: isCorrect,
                });
            }
        }
        const attempt = new Attempt({
            studentId: studentId,
            testId: testId,
            seriesId: test.seriesId,
            courseId: test.seriesId,
            attemptNumber: attemptNumber,
            isReattempt: isReattempt,
            answers: processedAnswers,
            score: score,
            totalQuestions: test.questions.length,
            duration: duration || 0,
            attemptedAt: new Date(),
        });
        await attempt.save();
        const allUserAttempts = await Attempt.find({
            studentId: studentId,
            testId: testId,
        });
        const bestAttempt = allUserAttempts.reduce((best, current) => (current.score > best.score ? current : best));
        const currentAvgScore = enrollment.progress.avgScore || 0;
        const currentTestsAttempted = enrollment.progress.testsAttempted || 0;
        // Only count as new test if this is first attempt
        const newTestsAttempted = isReattempt ? currentTestsAttempted : currentTestsAttempted + 1;
        const bestScorePercentage = (bestAttempt.score / test.questions.length) * 100;
        const newAvgScore = isReattempt
            ? currentAvgScore // Don't change average for reattempts, use best score logic elsewhere
            : (currentAvgScore * currentTestsAttempted + bestScorePercentage) / newTestsAttempted;
        await Enrollment.findByIdAndUpdate(enrollment._id, {
            $set: {
                "progress.testsAttempted": newTestsAttempted,
                "progress.avgScore": Math.round(newAvgScore * 100) / 100,
                "progress.lastAttemptAt": new Date(),
            },
        });
        const percentage = test.questions.length > 0 ? Math.round((score / test.questions.length) * 100) : 0;
        res.json({
            success: true,
            message: isReattempt ? "Test reattempted successfully" : "Test submitted successfully",
            data: {
                attempt: {
                    _id: attempt._id,
                    attemptNumber: attemptNumber,
                    isReattempt: isReattempt,
                    score: score,
                    totalQuestions: test.questions.length,
                    percentage: percentage,
                    duration: duration,
                    attemptedAt: attempt.attemptedAt,
                },
                results: {
                    correctAnswers: processedAnswers.filter((a) => a.isCorrect).length,
                    incorrectAnswers: processedAnswers.filter((a) => !a.isCorrect).length,
                    totalQuestions: test.questions.length,
                },
                previousAttempts: existingAttempts.map((prev) => ({
                    attemptNumber: prev.attemptNumber,
                    score: prev.score,
                    percentage: Math.round((prev.score / prev.totalQuestions) * 100),
                })),
                canReattempt: attemptNumber < 2,
            },
        });
    }
    catch (error) {
        console.error("Submit test attempt error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit test attempt",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Test Results
const getTestResults = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { testId } = req.params;
        // Get attempt details
        const attempt = await Attempt.findOne({
            studentId: studentId,
            testId: testId,
        })
            .populate({
            path: "testId",
            select: "title description mode totalMarks",
            populate: {
                path: "seriesId",
                select: "title",
            },
        })
            .populate({
            path: "answers.questionId",
            select: "question options correctOption explain info subject",
        });
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Test attempt not found",
            });
        }
        // Calculate detailed results
        const percentage = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
        const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
        const incorrectAnswers = attempt.answers.filter((a) => !a.isCorrect).length;
        // Group results by subject
        const subjectWiseResults = {};
        attempt.answers.forEach((answer) => {
            const subject = answer.questionId.subject;
            if (!subjectWiseResults[subject]) {
                subjectWiseResults[subject] = {
                    total: 0,
                    correct: 0,
                    incorrect: 0,
                };
            }
            subjectWiseResults[subject].total++;
            if (answer.isCorrect) {
                subjectWiseResults[subject].correct++;
            }
            else {
                subjectWiseResults[subject].incorrect++;
            }
        });
        // Format detailed answers for review
        const detailedAnswers = attempt.answers.map((answer, index) => ({
            questionNumber: index + 1,
            question: answer.questionId.question,
            options: answer.questionId.options,
            selectedOption: answer.selectedOption,
            correctOption: answer.questionId.correctOption,
            isCorrect: answer.isCorrect,
            explanation: answer.questionId.explain,
            info: answer.questionId.info,
            subject: answer.questionId.subject,
        }));
        res.json({
            success: true,
            data: {
                attempt: {
                    _id: attempt._id,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: percentage,
                    duration: attempt.duration,
                    attemptedAt: attempt.attemptedAt,
                },
                test: attempt.testId,
                results: {
                    correctAnswers,
                    incorrectAnswers,
                    totalQuestions: attempt.totalQuestions,
                    percentage,
                    subjectWiseResults,
                },
                detailedAnswers,
            },
        });
    }
    catch (error) {
        console.error("Get test results error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load test results",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
export { getTestDetails, submitTestAttempt, getTestResults, };
