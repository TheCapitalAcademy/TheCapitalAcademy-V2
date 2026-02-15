import moment from "moment";
import Series from '../../models/series/series.js';
import Attempt from '../../models/series/TestAttempt.js';
import Test from '../../models/series/test.js';
import Enrollment from '../../models/series/enrollments.js';
// Get Student Dashboard Data
const getDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Get all enrollments for the student
        const enrollments = await Enrollment.find({ userId: studentId })
            .populate({
            path: "seriesId",
            select: "title coverImageUrl description subjects difficulty totalTests expiresAt slug",
        })
            .sort({ createdAt: -1 });
        if (!enrollments.length) {
            return res.json({
                success: true,
                message: "No enrollments found",
                data: {
                    enrolledSeries: [],
                    stats: {
                        totalSeries: 0,
                        totalTestsAttempted: 0,
                        averageScore: 0,
                    },
                },
            });
        }
        // Calculate overall stats
        const totalSeries = enrollments.length;
        const totalTestsAttempted = enrollments.reduce((sum, enrollment) => sum + enrollment.progress.testsAttempted, 0);
        const avgScores = enrollments.filter((e) => e.progress.avgScore).map((e) => e.progress.avgScore);
        const averageScore = avgScores.length > 0 ? avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length : 0;
        // Format enrolled series data
        const enrolledSeries = enrollments.map((enrollment) => ({
            enrollmentId: enrollment._id,
            series: enrollment.seriesId,
            activatedAt: enrollment.activatedAt,
            expiresAt: enrollment.expiresAt,
            progress: enrollment.progress,
            isExpired: enrollment.expiresAt ? moment().isAfter(enrollment.expiresAt) : false,
        }));
        res.json({
            success: true,
            data: {
                enrolledSeries,
                stats: {
                    totalSeries,
                    totalTestsAttempted,
                    averageScore: Math.round(averageScore * 100) / 100,
                },
            },
        });
    }
    catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Tests for a Specific Series
const getSeriesTests = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { seriesId } = req.params;
        // Check if student is enrolled in this series
        const enrollment = await Enrollment.findOne({
            userId: studentId,
            seriesId: seriesId,
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
        // Get all tests for this series
        const tests = await Test.find({
            seriesId: seriesId,
            isPublished: true,
        })
            .select("title description subjects mode durationMin totalMarks availability")
            .sort({ createdAt: 1 });
        // Get student's attempts for these tests
        const testIds = tests.map((test) => test._id);
        const attempts = await Attempt.find({
            studentId: studentId,
            testId: { $in: testIds },
        }).select("testId score attemptedAt attemptNumber isReattempt");
        // Create attempts map for quick lookup
        const attemptsMap = {};
        attempts.forEach((attempt) => {
            attemptsMap[attempt.testId.toString()] = attempt;
        });
        // Categorize tests based on availability and attempts
        const now = moment();
        const categorizedTests = {
            availableToday: [],
            upcoming: [],
            completed: [],
        };
        tests.forEach((test) => {
            var _a, _b;
            const testId = test._id.toString();
            const attempt = attemptsMap[testId];
            const startTime = ((_a = test.availability) === null || _a === void 0 ? void 0 : _a.startAt) ? moment(test.availability.startAt) : null;
            const endTime = ((_b = test.availability) === null || _b === void 0 ? void 0 : _b.endAt) ? moment(test.availability.endAt) : null;
            const testData = {
                _id: test._id,
                title: test.title,
                description: test.description,
                subjects: test.subjects,
                mode: test.mode,
                durationMin: test.durationMin,
                totalMarks: test.totalMarks,
                availability: test.availability,
                attempt: attempt || null,
                status: null,
            };
            // Determine test status
            if (attempt) {
                testData.status = "completed";
                categorizedTests.completed.push(testData);
            }
            else if (!startTime || now.isSameOrAfter(startTime)) {
                if (!endTime || now.isSameOrBefore(endTime)) {
                    testData.status = "available";
                    categorizedTests.availableToday.push(testData);
                }
                else {
                    testData.status = "expired";
                    categorizedTests.completed.push(testData);
                }
            }
            else {
                testData.status = "upcoming";
                categorizedTests.upcoming.push(testData);
            }
        });
        res.json({
            success: true,
            data: {
                seriesId,
                enrollment: {
                    activatedAt: enrollment.activatedAt,
                    expiresAt: enrollment.expiresAt,
                    progress: enrollment.progress,
                },
                tests: categorizedTests,
                summary: {
                    total: tests.length,
                    available: categorizedTests.availableToday.length,
                    upcoming: categorizedTests.upcoming.length,
                    completed: categorizedTests.completed.length,
                },
            },
        });
    }
    catch (error) {
        console.error("Get series tests error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load series tests",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Available Series for Enrollment
const getAvailableSeries = async (req, res) => {
    try {
        const studentId = req.user.id;
        // Get all active series
        const allSeries = await Series.find({
            isActive: true,
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
        }).sort({ createdAt: -1 });
        // Get student's current enrollments
        const enrollments = await Enrollment.find({ userId: studentId }).select("seriesId");
        const enrolledSeriesIds = enrollments.map((e) => e.seriesId.toString());
        // Filter out already enrolled series
        const availableSeries = allSeries.filter((series) => !enrolledSeriesIds.includes(series._id.toString()));
        res.json({
            success: true,
            data: {
                availableSeries,
                totalAvailable: availableSeries.length,
            },
        });
    }
    catch (error) {
        console.error("Get available series error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load available series",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
// Get Student's Recent Activity
const getRecentActivity = async (req, res) => {
    try {
        const studentId = req.user.id;
        const limit = Number.parseInt(req.query.limit) || 10;
        // Get recent test attempts
        const recentAttempts = await Attempt.find({ studentId })
            .populate({
            path: "testId",
            select: "title mode",
        })
            .populate({
            path: "seriesId",
            select: "title",
        })
            .sort({ attemptedAt: -1 })
            .limit(limit);
        const activities = recentAttempts.map((attempt) => {
            var _a, _b;
            return ({
                type: "test_attempt",
                testTitle: (_a = attempt.testId) === null || _a === void 0 ? void 0 : _a.title,
                seriesTitle: (_b = attempt.seriesId) === null || _b === void 0 ? void 0 : _b.title,
                score: attempt.score,
                totalQuestions: attempt.totalQuestions,
                percentage: attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0,
                attemptedAt: attempt.attemptedAt,
                duration: attempt.duration,
            });
        });
        res.json({
            success: true,
            data: {
                activities,
                total: activities.length,
            },
        });
    }
    catch (error) {
        console.error("Get recent activity error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to load recent activity",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
export { getDashboard, getSeriesTests, getAvailableSeries, getRecentActivity, };
