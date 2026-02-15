var _a;
import mongoose, { Schema } from 'mongoose';
const referralCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    priceDiscount: {
        type: Number,
        required: true
    },
    expireDate: {
        type: Date,
        required: false
    }
});
// Prevent OverwriteModelError
const ReferalModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.ReferralCode) || mongoose.model('ReferralCode', referralCodeSchema);
export default ReferalModel;
