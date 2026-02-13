import mongoose from 'mongoose'

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
        enum: ['easy', 'medium', 'hard'], // Only allow values 'easy', 'medium', or 'hard'
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
        type: String,//need to change into text format
        enum: ['past', 'normal'], // Only allow values 'past' or 'normal'
        required: true
    },
    topic: {
        type: String,
        default: "",
    },
    course: {
        type: String,
        enum: ['mdcat', 'nums'], // Only allow values 'past' or 'normal'
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
mcqSchema.index({ question: 1 })
mcqSchema.index({ difficulty: 1 })
mcqSchema.index({ subject: 1 })
mcqSchema.index({ chapter: 1 })
mcqSchema.index({ category: 1 })
mcqSchema.index({ topic: 1 })
mcqSchema.index({ course: 1 })


// Prevent OverwriteModelError
const McqModel = mongoose?.models?.MCQ || mongoose.model('MCQ', mcqSchema)

export default McqModel
