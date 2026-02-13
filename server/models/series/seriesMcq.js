import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const seriesMcqSchema = new Schema(
    {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOption: { type: Number, required: true },
        subject: {
            type: String,
            enum: ['physics', 'chemistry', 'biology', 'english', 'mathematics', 'logic', 'others'],
            required: true
        },
        chapter: { type: String, required: true },
        topic: { type: String, required: true },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'easy'
        },
        category: {
            type: String,
            enum: ['normal', 'critical'],
            default: 'normal'
        },
        course: {
            type: String,
            enum: ['mdcat', 'ecat', 'nts'],
            default: 'mdcat'
        },
        info: { type: String, default: '' },
        explain: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        questionImg: { type: String, default: '' },
        aiGenerated: { type: Boolean, default: false }, // Track if explanation is AI-generated
        seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
        testId: { type: Schema.Types.ObjectId, ref: "Test" },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

const SeriesMCQ = model("SeriesMCQ", seriesMcqSchema);
export default SeriesMCQ;
