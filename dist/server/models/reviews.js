var _a;
import mongoose, { Schema } from 'mongoose';
const reviewSchema = new Schema({
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
const ReviewModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.Review) || mongoose.model('Review', reviewSchema);
export default ReviewModel;
