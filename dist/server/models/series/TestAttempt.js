import mongoose from "mongoose";
const attemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: true,
    },
    seriesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Series",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    attemptNumber: {
        type: Number,
        default: 1,
        min: 1,
        max: 2, // Allow maximum 2 attempts (original + 1 reattempt)
    },
    answers: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SeriesMCQ",
                required: true,
            },
            selectedOption: {
                type: Number,
                required: true,
            },
            isCorrect: {
                type: Boolean,
                default: false,
            },
        },
    ],
    score: {
        type: Number,
        default: 0,
    },
    totalQuestions: {
        type: Number,
        default: 0,
    },
    attemptedAt: {
        type: Date,
        default: Date.now,
    },
    duration: {
        type: Number,
    },
    isReattempt: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
attemptSchema.index({ studentId: 1, testId: 1, attemptNumber: 1 }, { unique: true });
export default mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);
