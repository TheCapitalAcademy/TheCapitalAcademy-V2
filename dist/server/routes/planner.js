import express from "express";
import { StudyPlan, StudyAnalytics } from "../models/planner.js";
import { authUser } from '../middleware/auth.middleware.js';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { mdcatBioChapters, mdcatChemistryChapters, mdcatEnglishChapters, mdcatLogicChapter, mdcatPhysicsChapters, numsBioChapters, numsChemistryChapters, numsEnglishChapters, numsPhysicsChapters } from '../helpers/chaperts.js';
const plannerRouter = express.Router();
// Your hardcoded subjects data
const COURSE_DATA = {
    nums: {
        biology: numsBioChapters.map(chapter => chapter.name),
        chemistry: numsChemistryChapters.map(chapter => chapter.name),
        physics: numsPhysicsChapters.map(chapter => chapter.name),
        english: numsEnglishChapters.map(chapter => chapter.name)
    },
    mdcat: {
        biology: mdcatBioChapters.map(chapter => chapter.name),
        chemistry: mdcatChemistryChapters.map(chapter => chapter.name),
        physics: mdcatPhysicsChapters.map(chapter => chapter.name),
        english: mdcatEnglishChapters.map(chapter => chapter.name),
        logic: mdcatLogicChapter.map(chapter => chapter.name)
    },
};
// Helper function to divide topics into weeks
const divideTopicsIntoWeeks = (topics, weeks) => {
    const topicsPerWeek = Math.ceil(topics.length / weeks);
    const result = [];
    for (let i = 0; i < weeks; i++) {
        const start = i * topicsPerWeek;
        const end = start + topicsPerWeek;
        result.push(topics.slice(start, end));
    }
    return result;
};
// Load user's study plan
plannerRouter.get("/load", authUser, asyncWrapper(async (req, res) => {
    try {
        const userId = req.user.id;
        // Find active study plan
        const studyPlan = await StudyPlan.findOne({
            userId,
            isActive: true,
        }).populate("userId", "name email courseType");
        if (!studyPlan) {
            return res.json({
                success: false,
                message: "No active study plan found",
            });
        }
        // Get analytics
        const analytics = await StudyAnalytics.findOne({
            userId,
            studyPlanId: studyPlan._id,
        });
        res.json({
            success: true,
            studyPlan,
            analytics,
        });
    }
    catch (error) {
        console.error("Error loading study plan:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}));
// Save/Update study plan
plannerRouter.post("/save", authUser, asyncWrapper(async (req, res) => {
    try {
        const { studyPlanId, courseType, totalWeeks, completedWeeks, weekIndex, completedAt, startDate } = req.body;
        let studyPlan;
        const userId = req.user.id;
        if (studyPlanId) {
            // Update existing study plan
            studyPlan = await StudyPlan.findById(studyPlanId);
            if (studyPlan) {
                studyPlan.courseType = courseType;
                studyPlan.totalWeeks = totalWeeks;
                studyPlan.completedWeeks = completedWeeks;
                if (startDate) {
                    studyPlan.startDate = new Date(startDate);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + totalWeeks * 7);
                    studyPlan.endDate = endDate;
                }
                // Update specific week if provided
                if (weekIndex !== undefined) {
                    const weekProgress = studyPlan.weeklyProgress.find((w) => w.weekNumber === weekIndex + 1);
                    if (weekProgress) {
                        weekProgress.isCompleted = completedWeeks[weekIndex];
                        weekProgress.completedAt = completedAt ? new Date(completedAt) : null;
                    }
                }
                // Calculate completion rate
                const completedCount = completedWeeks.filter(Boolean).length;
                studyPlan.completionRate = (completedCount / totalWeeks) * 100;
                await studyPlan.save();
            }
        }
        else {
            // Create new study plan
            const courseData = COURSE_DATA[courseType];
            const weeklyProgress = [];
            // Generate weekly progress with topics
            for (let i = 0; i < totalWeeks; i++) {
                const weekDate = new Date(startDate || Date.now());
                weekDate.setDate(weekDate.getDate() + i * 7);
                const weekTopics = {};
                Object.entries(courseData).forEach(([subject, topics]) => {
                    const dividedTopics = divideTopicsIntoWeeks(topics, totalWeeks);
                    weekTopics[subject] = dividedTopics[i] || [];
                });
                weeklyProgress.push({
                    weekNumber: i + 1,
                    weekDate,
                    isCompleted: completedWeeks[i] || false,
                    topics: weekTopics,
                });
            }
            const endDate = new Date(startDate || Date.now());
            endDate.setDate(endDate.getDate() + totalWeeks * 7);
            studyPlan = new StudyPlan({
                userId,
                courseType,
                totalWeeks,
                startDate: startDate || Date.now(),
                endDate,
                completedWeeks,
                weeklyProgress,
                completionRate: (completedWeeks.filter(Boolean).length / totalWeeks) * 100,
            });
            await studyPlan.save();
            // Create analytics record
            const analytics = new StudyAnalytics({
                userId,
                studyPlanId: studyPlan._id,
                completedTopics: completedWeeks.filter(Boolean).length,
                completionRate: studyPlan.completionRate,
            });
            await analytics.save();
        }
        // Update analytics
        await StudyAnalytics.findOneAndUpdate({ userId, studyPlanId: studyPlan._id }, {
            completedTopics: completedWeeks.filter(Boolean).length,
            completionRate: studyPlan.completionRate,
            lastActivityDate: new Date(),
        }, { upsert: true });
        res.json({
            success: true,
            message: "Study plan saved successfully",
            studyPlan,
        });
    }
    catch (error) {
        console.error("Error saving study plan:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}));
export default plannerRouter;
