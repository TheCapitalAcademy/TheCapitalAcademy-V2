import express from 'express';
const router = express.Router();
import Series from '../../models/series/series.js';
import Test from '../../models/series/test.js';
import Enrollment from '../../models/series/enrollments.js';
import Payment from '../../models/series/orders.js';
import { optionalAuth, authUser } from '../../middleware/auth.middleware.js';
import { asyncWrapper } from '../../helpers/asyncWrapper.js';
import { getAvailableSeries, getDashboard, getRecentActivity, getSeriesTests } from '../../controllers/series/student.controller.js';
import { getOverallProgress, getPerformanceAnalytics, getSeriesProgress } from '../../controllers/series/progress.controller.js';
// Get all series
router.get("/", optionalAuth, asyncWrapper(async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // null if guest
        const now = new Date();
        // 1. Fetch all active series
        const seriesList = await Series.find({
            isActive: true,
            $or: [
                { expiresAt: { $gte: now } },
                { expiresAt: null }
            ]
        }).lean();
        let enrollmentMap = {};
        // 2. If logged in → get user enrollments
        if (userId) {
            const enrollments = await Enrollment.find({
                userId,
                seriesId: { $in: seriesList.map(s => s._id) }
            }).lean();
            enrollments.forEach(e => {
                enrollmentMap[e.seriesId.toString()] = e;
            });
        }
        // 3. Attach enrollment info
        const data = seriesList.map(series => (Object.assign(Object.assign({}, series), { enrolled: !!enrollmentMap[series._id.toString()], enrollment: enrollmentMap[series._id.toString()] || null })));
        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    }
    catch (error) {
        console.error("Error fetching series:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching series"
        });
    }
}));
router.get("/timetable", authUser, async (req, res) => {
    try {
        const userId = req.user.id;
        // 1️⃣ Find all series user is enrolled in
        const enrollments = await Enrollment.find({ userId })
            .populate("seriesId", "title")
            .lean();
        const seriesIds = enrollments.map((e) => e.seriesId._id);
        // 2️⃣ Fetch tests of those series
        const tests = await Test.find({
            seriesId: { $in: seriesIds },
            isPublished: true,
        })
            .populate("seriesId", "title")
            .lean();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // zero time for comparison
        // 3️⃣ Organize data
        const timetable = {};
        const enrolledSeries = [];
        enrollments.forEach((en) => {
            enrolledSeries.push({
                id: en.seriesId._id,
                title: en.seriesId.title,
            });
        });
        tests.forEach((test) => {
            var _a, _b;
            const seriesKey = test.seriesId._id.toString();
            if (!timetable[seriesKey]) {
                timetable[seriesKey] = [];
            }
            const startAt = ((_a = test.availability) === null || _a === void 0 ? void 0 : _a.startAt) ? new Date(test.availability.startAt) : null;
            const endAt = ((_b = test.availability) === null || _b === void 0 ? void 0 : _b.endAt) ? new Date(test.availability.endAt) : null;
            // Determine status
            let status = "upcoming";
            if (startAt) {
                const startDate = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate());
                if (endAt && endAt < now) {
                    status = "completed";
                }
                else if (startDate.getTime() === today.getTime()) {
                    status = "available";
                }
                else if (startDate < today) {
                    status = "available"; // test started but not ended yet
                }
                else {
                    status = "upcoming";
                }
            }
            timetable[seriesKey].push({
                id: test._id,
                title: test.title,
                subjects: test.subjects,
                totalMarks: test.totalMarks,
                durationMin: test.durationMin,
                date: startAt,
                status,
            });
        });
        res.json({
            success: true,
            enrolledSeries,
            timetable,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.get("/view/:slug", authUser, async (req, res) => {
    var _a;
    try {
        const { slug } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // from auth middleware
        // 1️⃣ Find the series by slug
        const series = await Series.findOne({ slug }).lean();
        if (!series) {
            return res.status(404).json({ success: false, message: "Series not found" });
        }
        // 2️⃣ Check if user is enrolled
        const enrollment = await Enrollment.findOne({
            userId,
            seriesId: series._id,
        }).lean();
        res.json({
            success: true,
            series,
            enrollment: enrollment
                ? {
                    activatedAt: enrollment.activatedAt,
                    expiresAt: enrollment.expiresAt,
                    progress: enrollment.progress,
                }
                : null, // if not enrolled
        });
    }
    catch (err) {
        console.error("Error fetching series detail:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
router.get("/my-series", authUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        // 1️⃣ Find all series where user is enrolled
        const enrollments = await Enrollment.find({ userId })
            .populate("seriesId")
            .lean();
        if (!enrollments.length) {
            return res.json({ success: true, enrolledSeries: [] });
        }
        const seriesIds = enrollments.map((e) => e.seriesId._id);
        // 2️⃣ Fetch all tests of these series
        const tests = await Test.find({
            seriesId: { $in: seriesIds },
            isPublished: true,
        })
            .populate("seriesId", "title slug coverImageUrl")
            .lean();
        // 3️⃣ Group tests into upcoming / today / completed
        const testsBySeries = {};
        tests.forEach((test) => {
            var _a, _b;
            const sid = test.seriesId._id.toString();
            if (!testsBySeries[sid]) {
                testsBySeries[sid] = {
                    upcoming: [],
                    availableToday: [],
                    completed: [],
                };
            }
            const startAt = (_a = test.availability) === null || _a === void 0 ? void 0 : _a.startAt;
            const endAt = (_b = test.availability) === null || _b === void 0 ? void 0 : _b.endAt;
            let status = "upcoming";
            if (startAt && endAt) {
                if (now < startAt) {
                    status = "upcoming";
                }
                else if (now >= startAt && now <= endAt) {
                    status = "availableToday";
                }
                else if (endAt < now) {
                    status = "completed";
                }
            }
            testsBySeries[sid][status].push({
                id: test._id,
                title: test.title,
                subjects: test.subjects,
                totalMarks: test.totalMarks,
                durationMin: test.durationMin,
                availability: test.availability,
            });
        });
        // 4️⃣ Combine data: enrollment + series + tests
        const enrolledSeries = enrollments.map((en) => {
            const sid = en.seriesId._id.toString();
            return {
                id: sid,
                slug: en.seriesId.slug,
                title: en.seriesId.title,
                coverImageUrl: en.seriesId.coverImageUrl,
                description: en.seriesId.description,
                subjects: en.seriesId.subjects,
                difficulty: en.seriesId.difficulty,
                price: en.seriesId.price,
                totalTests: en.seriesId.totalTests,
                ratings: en.seriesId.ratings,
                progress: en.progress,
                activatedAt: en.activatedAt,
                expiresAt: en.expiresAt,
                tests: testsBySeries[sid] || {
                    upcoming: [],
                    availableToday: [],
                    completed: [],
                },
            };
        });
        res.json({ success: true, enrolledSeries });
    }
    catch (err) {
        console.error("Error fetching student series:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// Student Dashboard Routes
router.get("/dashboard", authUser, getDashboard);
router.get("/:seriesId/tests", authUser, getSeriesTests);
router.get("/available-series", authUser, getAvailableSeries);
router.get("/recent-activity", authUser, getRecentActivity);
router.get("/progress/overall", authUser, getOverallProgress);
router.get("/progress/series/:seriesId", authUser, getSeriesProgress);
router.get("/progress/analytics", authUser, getPerformanceAnalytics);
// =============for admin side ===============
router.get('/all', asyncWrapper(async (req, res) => {
    try {
        const series = await Series.find().populate('createdBy', 'username email');
        res.status(200).json(series);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch series" });
    }
}));
// Get single series by ID
router.get('/:id', asyncWrapper(async (req, res) => {
    try {
        const series = await Series.findById(req.params.id);
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        res.status(200).json(series);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch series" });
    }
}));
// Create new series
router.post('/', asyncWrapper(async (req, res) => {
    try {
        const { slug, title, coverImageUrl, description, subjects, difficulty, price, originalPrice, tags, totalTests, totalDurationMin, expiresAt } = req.body;
        // Check if series with same slug already exists
        const existingSeries = await Series.findOne({ slug });
        if (existingSeries) {
            return res.status(400).json({ error: "Series with this slug already exists" });
        }
        const series = new Series({
            slug,
            title,
            coverImageUrl,
            description,
            subjects,
            difficulty,
            price,
            originalPrice,
            tags,
            totalTests,
            totalDurationMin,
            expiresAt,
        });
        await series.save();
        res.status(201).json({ message: "Series created successfully", series });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create series" });
    }
}));
// Update series
router.put('/:id', asyncWrapper(async (req, res) => {
    try {
        const { slug, title, coverImageUrl, description, subjects, difficulty, price, originalPrice, isActive, tags, totalTests, totalDurationMin, expiresAt } = req.body;
        // Check if slug is being changed and if it already exists
        if (slug) {
            const existingSeries = await Series.findOne({ slug, _id: { $ne: req.params.id } });
            if (existingSeries) {
                return res.status(400).json({ error: "Series with this slug already exists" });
            }
        }
        const series = await Series.findByIdAndUpdate(req.params.id, {
            slug,
            title,
            coverImageUrl,
            description,
            subjects,
            difficulty,
            price,
            originalPrice,
            isActive,
            tags,
            totalTests,
            totalDurationMin,
            expiresAt
        }, { new: true });
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        res.status(200).json({ message: "Series updated successfully", series });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update series" });
    }
}));
// Delete series
router.delete('/:id', asyncWrapper(async (req, res) => {
    try {
        const series = await Series.findByIdAndDelete(req.params.id);
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        // Also delete related tests, enrollments, and payments
        await Test.deleteMany({ seriesId: req.params.id });
        await Enrollment.deleteMany({ seriesId: req.params.id });
        await Payment.deleteMany({ seriesId: req.params.id });
        res.status(200).json({ message: "Series deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete series" });
    }
}));
// Get series statistics
router.get('/:id/stats', asyncWrapper(async (req, res) => {
    try {
        const seriesId = req.params.id;
        const [enrollments, payments, tests] = await Promise.all([
            Enrollment.find({ seriesId }),
            Payment.find({ seriesId }),
            Test.find({ seriesId })
        ]);
        const totalEnrollments = enrollments.length;
        const totalRevenue = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        const totalTests = tests.length;
        const activeEnrollments = enrollments.filter(e => !e.expiresAt || e.expiresAt > new Date()).length;
        res.status(200).json({
            totalEnrollments,
            totalRevenue,
            totalTests,
            activeEnrollments,
            enrollmentData: enrollments,
            paymentData: payments
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch series statistics" });
    }
}));
export default router;
