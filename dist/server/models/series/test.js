import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const testSchema = new Schema({
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    title: { type: String, required: true },
    description: { type: String },
    subjects: [{ type: String, required: true }],
    mode: { type: String, enum: ["Exam", "Practice"], required: true },
    durationMin: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    availability: {
        startAt: { type: Date },
        endAt: { type: Date },
    },
    questions: [
        {
            questionId: { type: Schema.Types.ObjectId, ref: "SeriesMCQ", required: true },
            marks: { type: Number, default: 1 },
        },
    ],
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true } // auto adds createdAt & updatedAt
);
const Test = model("Test", testSchema);
export default Test;
