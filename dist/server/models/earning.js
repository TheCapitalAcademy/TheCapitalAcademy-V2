var _a;
import mongoose, { Schema } from 'mongoose';
const earningsSchema = new Schema({
    course: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
});
// Prevent OverwriteModelError
const EarningsModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.Earnings) || mongoose.model('Earnings', earningsSchema);
export default EarningsModel;
