var _a, _b;
import mongoose from 'mongoose';
const topbarSchema = new mongoose.Schema({
    tcontent: {
        type: String,
        default: "Welcome Dear Student! May Your Journey Be Filled With Joy & Success"
    },
    createdAt: { type: Date, default: Date.now },
});
const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: false,
    },
}, {
    timestamps: true
});
// Prevent OverwriteModelError
const Home = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.topbarSchema) || mongoose.model('Common', topbarSchema);
const Review = ((_b = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _b === void 0 ? void 0 : _b.reviewSchema) || mongoose.model('Review', reviewSchema);
export { Home, Review };
