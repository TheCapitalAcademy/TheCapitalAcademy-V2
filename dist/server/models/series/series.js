import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const seriesSchema = new Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    coverImageUrl: { type: String },
    description: { type: String, required: true },
    subjects: [{ type: String, required: true }],
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"] },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    totalTests: { type: Number, required: true },
    totalDurationMin: { type: Number },
    ratings: {
        count: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date },
}, { timestamps: true });
const Series = model("Series", seriesSchema);
export default Series;
