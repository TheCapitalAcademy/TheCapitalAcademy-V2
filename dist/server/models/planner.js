import mongoose from "mongoose";
// Study Plan Schema
const studyPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseType: {
        type: String,
        enum: ["nums", "mdcat"],
        required: true,
    },
    totalWeeks: {
        type: Number,
        required: true,
        min: 6,
        max: 16,
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    completedWeeks: [
        {
            type: Boolean,
            default: false,
        },
    ],
    weeklyProgress: [
        {
            weekNumber: {
                type: Number,
                required: true,
            },
            weekDate: {
                type: Date,
                required: true,
            },
            isCompleted: {
                type: Boolean,
                default: false,
            },
            completedAt: {
                type: Date,
            },
            topics: {
                biology: [String],
                chemistry: [String],
                physics: [String],
                english: [String],
                logic: [String], // Only for MDCAT
            },
            notes: {
                type: String,
                maxlength: 500,
            },
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
}, {
    timestamps: true,
});
// Study Analytics Schema
const studyAnalyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    studyPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudyPlan",
        required: true,
    },
    totalStudyTime: {
        type: Number,
        default: 0, // in minutes
    },
    completedTopics: {
        type: Number,
        default: 0,
    },
    completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    weeklyStats: [
        {
            weekNumber: Number,
            completedAt: Date,
            studyTime: Number,
            topicsCompleted: Number,
        },
    ],
    subjectProgress: {
        biology: {
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        chemistry: {
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        physics: {
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        english: {
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        logic: {
            completed: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
    },
    lastActivityDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Create indexes for better performance
studyPlanSchema.index({ userId: 1, isActive: 1 });
studyAnalyticsSchema.index({ userId: 1 });
// Create models
const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);
const StudyAnalytics = mongoose.model("StudyAnalytics", studyAnalyticsSchema);
export { StudyPlan, StudyAnalytics };
