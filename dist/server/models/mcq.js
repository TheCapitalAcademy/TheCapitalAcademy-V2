var _a;
import mongoose from 'mongoose';
const mcqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
    correctOption: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    subject: {
        type: String,
        enum: ['english', 'chemistry', 'physics', 'logic', 'biology'],
        required: true
    },
    chapter: {
        type: String,
        required: true,
    },
    // ----------------------------------------------------------------
    category: {
        type: String,
        enum: ['past', 'normal'],
        required: true
    },
    topic: {
        type: String,
        default: "",
    },
    course: {
        type: String,
        enum: ['mdcat', 'nums'],
        required: true,
    },
    info: {
        type: String,
        default: ""
    },
    explain: {
        type: String,
        default: "Explanation Not provided"
    },
    imageUrl: { type: String, default: null },
    questionImg: { type: String, default: null },
    aiGenerated: { type: Boolean, default: false }, // Track if explanation is AI-generated
});
// question difficulty subject chapter category topic course
mcqSchema.index({ question: 1 });
mcqSchema.index({ difficulty: 1 });
mcqSchema.index({ subject: 1 });
mcqSchema.index({ chapter: 1 });
mcqSchema.index({ category: 1 });
mcqSchema.index({ topic: 1 });
mcqSchema.index({ course: 1 });
// Prevent OverwriteModelError
const McqModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.MCQ) || mongoose.model('MCQ', mcqSchema);
export default McqModel;
