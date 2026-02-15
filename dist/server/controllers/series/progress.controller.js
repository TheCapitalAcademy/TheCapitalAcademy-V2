import moment from "moment";
import Series from '../../models/series/series.js';
import Attempt from '../../models/series/TestAttempt.js';
import Test from '../../models/series/test.js';
import Enrollment from '../../models/series/enrollments.js';
// Get Overall Progress Statistics
const getOverallProgress = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Get all enrollments
        const enrollments = await Enrollment.find({ userId: studentId }).populate({
            path: "seriesId",
            select: "title totalTests",
        });
        if (!enrollments.length) {
            return res.json({
                success: true,
                data: {
                    totalSeries: 0,
                    totalTestsAvailable: 0,
                    totalTestsAttempted: 0,
                    averageScore: 0,
                    completionRate: 0,
                    seriesProgress: [],
                },
            });
        }
        // Calculate overall statistics
        const totalSeries = enrollments.length;
        const totalTestsAvailable = enrollments.reduce((sum, enrollment) => { var _a; return sum + (((_a = enrollment.seriesId) === null || _a === void 0 ? void 0 : _a.totalTests) || 0); }, 0);
        const totalTestsAttempted = enrollments.reduce((sum, enrollment) => sum + enrollment.progress.testsAttempted, 0);
        // Calculate average score across all series
        const avgScores = enrollments.filter((e) => e.progress.avgScore).map((e) => e.progress.avgScore);
        const averageScore = avgScores.length > 0 ? avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length : 0;
        // Calculate completion rate
        const completionRate = totalTestsAvailable > 0 ? (totalTestsAttempted / totalTestsAvailable) * 100 : 0;
        // Get series-wise progress
        const seriesProgress = enrollments.map((enrollment) => {
            var _a, _b, _c;
            const seriesTests = ((_a = enrollment.seriesId) === null || _a === void 0 ? void 0 : _a.totalTests) || 0;
            const attemptedTests = enrollment.progress.testsAttempted || 0;
            const seriesCompletionRate = seriesTests > 0 ? (attemptedTests / seriesTests) * 100 : 0;
            return {
                seriesId: (_b = enrollment.seriesId) === null || _b === void 0 ? void 0 : _b._id,
                seriesTitle: (_c = enrollment.seriesId) === null || _c === void 0 ? void 0 : _c.title,
                totalTests: seriesTests,
                attemptedTests: attemptedTests,
                averageScore: enrollment.progress.avgScore || 0,
                completionRate: Math.round(seriesCompletionRate * 100) / 100,
                lastAttemptAt: enrollment.progress.lastAttemptAt,
                enrolledAt: enrollment.activatedAt,
                expiresAt: enrollment.expiresAt,
            };
        });
        res.json({
            success: true,
            data: {
                totalSeries,
                totalTestsAvailable,
                totalTestsAttempted,
                averageScore: Math.round(averageScore * 100) / 100,
                completionRate: Math.round(completionRate * 100) / 100,
                seriesProgress,
            },
        });
    }
    catch (error) {
        console.error("Get overall progress error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load progress statistics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Series-Specific Progress
const getSeriesProgress = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { seriesId } = req.params;
        // Check enrollment
        const enrollment = await Enrollment.findOne({
            userId: studentId,
            seriesId: seriesId,
        }).populate({
            path: "seriesId",
            select: "title totalTests subjects",
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: "You are not enrolled in this series",
            });
        }
        // Get all tests in this series
        const tests = await Test.find({
            seriesId: seriesId,
            isPublished: true,
        }).select("title subjects mode totalMarks");
        // Get student's attempts for this series
        const attempts = await Attempt.find({
            studentId: studentId,
            seriesId: seriesId,
        }).populate({
            path: "testId",
            select: "title subjects mode",
        });
        // Calculate subject-wise progress
        const subjectProgress = {};
        const allSubjects = enrollment.seriesId.subjects || [];
        allSubjects.forEach((subject) => {
            subjectProgress[subject] = {
                totalTests: 0,
                attemptedTests: 0,
                totalScore: 0,
                totalQuestions: 0,
                averageScore: 0,
            };
        });
        // Count tests by subject
        tests.forEach((test) => {
            test.subjects.forEach((subject) => {
                if (subjectProgress[subject]) {
                    subjectProgress[subject].totalTests++;
                }
            });
        });
        // Calculate attempted tests and scores by subject
        attempts.forEach((attempt) => {
            if (attempt.testId && attempt.testId.subjects) {
                attempt.testId.subjects.forEach((subject) => {
                    if (subjectProgress[subject]) {
                        subjectProgress[subject].attemptedTests++;
                        subjectProgress[subject].totalScore += attempt.score;
                        subjectProgress[subject].totalQuestions += attempt.totalQuestions;
                    }
                });
            }
        });
        // Calculate average scores
        Object.keys(subjectProgress).forEach((subject) => {
            const progress = subjectProgress[subject];
            if (progress.totalQuestions > 0) {
                progress.averageScore = Math.round((progress.totalScore / progress.totalQuestions) * 100 * 100) / 100;
            }
        });
        // Get recent attempts for this series
        const recentAttempts = attempts
            .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
            .slice(0, 5)
            .map((attempt) => {
            var _a, _b;
            return ({
                testId: (_a = attempt.testId) === null || _a === void 0 ? void 0 : _a._id,
                testTitle: (_b = attempt.testId) === null || _b === void 0 ? void 0 : _b.title,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                percentage: attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0,
                attemptedAt: attempt.attemptedAt,
                duration: attempt.duration,
            });
        });
        // Calculate time-based progress (last 30 days)
        const thirtyDaysAgo = moment().subtract(30, "days").toDate();
        const recentAttempts30Days = attempts.filter((attempt) => new Date(attempt.attemptedAt) >= thirtyDaysAgo);
        const weeklyProgress = {};
        for (let i = 0; i < 4; i++) {
            const weekStart = moment()
                .subtract((i + 1) * 7, "days")
                .startOf("day");
            const weekEnd = moment()
                .subtract(i * 7, "days")
                .endOf("day");
            const weekAttempts = recentAttempts30Days.filter((attempt) => moment(attempt.attemptedAt).isBetween(weekStart, weekEnd, null, "[]"));
            weeklyProgress[`week${4 - i}`] = {
                testsAttempted: weekAttempts.length,
                averageScore: weekAttempts.length > 0
                    ? weekAttempts.reduce((sum, attempt) => {
                        const percentage = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
                        return sum + percentage;
                    }, 0) / weekAttempts.length
                    : 0,
            };
        }
        res.json({
            success: true,
            data: {
                series: enrollment.seriesId,
                enrollment: {
                    activatedAt: enrollment.activatedAt,
                    expiresAt: enrollment.expiresAt,
                    progress: enrollment.progress,
                },
                overallProgress: {
                    totalTests: tests.length,
                    attemptedTests: attempts.length,
                    completionRate: tests.length > 0 ? Math.round((attempts.length / tests.length) * 100 * 100) / 100 : 0,
                    averageScore: enrollment.progress.avgScore || 0,
                },
                subjectProgress,
                recentAttempts,
                weeklyProgress,
            },
        });
    }
    catch (error) {
        console.error("Get series progress error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load series progress",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Performance Analytics
const getPerformanceAnalytics = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { timeframe = "30" } = req.query; // days
        const daysAgo = Number.parseInt(timeframe) || 30;
        const startDate = moment().subtract(daysAgo, "days").toDate();
        // Get attempts within timeframe
        const attempts = await Attempt.find({
            studentId: studentId,
            attemptedAt: { $gte: startDate },
        })
            .populate({
            path: "testId",
            select: "title mode subjects",
        })
            .populate({
            path: "seriesId",
            select: "title",
        })
            .sort({ attemptedAt: 1 });
        if (!attempts.length) {
            return res.json({
                success: true,
                data: {
                    totalAttempts: 0,
                    averageScore: 0,
                    improvementTrend: 0,
                    performanceBySubject: {},
                    performanceByMode: {},
                    dailyActivity: {},
                    strengths: [],
                    weaknesses: [],
                },
            });
        }
        // Calculate overall metrics
        const totalAttempts = attempts.length;
        const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
        const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
        const averageScore = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
        // Calculate improvement trend (compare first half vs second half)
        const midPoint = Math.floor(attempts.length / 2);
        const firstHalf = attempts.slice(0, midPoint);
        const secondHalf = attempts.slice(midPoint);
        const firstHalfAvg = firstHalf.length > 0
            ? firstHalf.reduce((sum, attempt) => {
                const percentage = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
                return sum + percentage;
            }, 0) / firstHalf.length
            : 0;
        const secondHalfAvg = secondHalf.length > 0
            ? secondHalf.reduce((sum, attempt) => {
                const percentage = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
                return sum + percentage;
            }, 0) / secondHalf.length
            : 0;
        const improvementTrend = secondHalfAvg - firstHalfAvg;
        // Performance by subject
        const performanceBySubject = {};
        attempts.forEach((attempt) => {
            if (attempt.testId && attempt.testId.subjects) {
                attempt.testId.subjects.forEach((subject) => {
                    if (!performanceBySubject[subject]) {
                        performanceBySubject[subject] = {
                            attempts: 0,
                            totalScore: 0,
                            totalQuestions: 0,
                            averageScore: 0,
                        };
                    }
                    performanceBySubject[subject].attempts++;
                    performanceBySubject[subject].totalScore += attempt.score;
                    performanceBySubject[subject].totalQuestions += attempt.totalQuestions;
                });
            }
        });
        // Calculate average scores for subjects
        Object.keys(performanceBySubject).forEach((subject) => {
            const perf = performanceBySubject[subject];
            perf.averageScore =
                perf.totalQuestions > 0 ? Math.round((perf.totalScore / perf.totalQuestions) * 100 * 100) / 100 : 0;
        });
        // Performance by mode (Exam vs Practice)
        const performanceByMode = {};
        attempts.forEach((attempt) => {
            var _a;
            const mode = ((_a = attempt.testId) === null || _a === void 0 ? void 0 : _a.mode) || "Unknown";
            if (!performanceByMode[mode]) {
                performanceByMode[mode] = {
                    attempts: 0,
                    totalScore: 0,
                    totalQuestions: 0,
                    averageScore: 0,
                };
            }
            performanceByMode[mode].attempts++;
            performanceByMode[mode].totalScore += attempt.score;
            performanceByMode[mode].totalQuestions += attempt.totalQuestions;
        });
        // Calculate average scores for modes
        Object.keys(performanceByMode).forEach((mode) => {
            const perf = performanceByMode[mode];
            perf.averageScore =
                perf.totalQuestions > 0 ? Math.round((perf.totalScore / perf.totalQuestions) * 100 * 100) / 100 : 0;
        });
        // Daily activity
        const dailyActivity = {};
        attempts.forEach((attempt) => {
            const date = moment(attempt.attemptedAt).format("YYYY-MM-DD");
            if (!dailyActivity[date]) {
                dailyActivity[date] = {
                    attempts: 0,
                    totalScore: 0,
                    totalQuestions: 0,
                };
            }
            dailyActivity[date].attempts++;
            dailyActivity[date].totalScore += attempt.score;
            dailyActivity[date].totalQuestions += attempt.totalQuestions;
        });
        // Identify strengths and weaknesses
        const subjectScores = Object.entries(performanceBySubject)
            .map(([subject, data]) => ({
            subject,
            score: data.averageScore,
            attempts: data.attempts,
        }))
            .filter((item) => item.attempts >= 2); // Only consider subjects with at least 2 attempts
        const strengths = subjectScores
            .filter((item) => item.score >= 75)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((item) => item.subject);
        const weaknesses = subjectScores
            .filter((item) => item.score < 60)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((item) => item.subject);
        res.json({
            success: true,
            data: {
                timeframe: daysAgo,
                totalAttempts,
                averageScore: Math.round(averageScore * 100) / 100,
                improvementTrend: Math.round(improvementTrend * 100) / 100,
                performanceBySubject,
                performanceByMode,
                dailyActivity,
                strengths,
                weaknesses,
            },
        });
    }
    catch (error) {
        console.error("Get performance analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load performance analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
export { getOverallProgress, getSeriesProgress, getPerformanceAnalytics, };
