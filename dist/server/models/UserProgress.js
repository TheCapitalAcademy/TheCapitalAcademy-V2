var _a;
import mongoose from 'mongoose';
const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    solved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
    wrong: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
    totalSave: { type: Number, default: 0 },
    lastSaveAt: { type: Date, default: Date.now },
}, { timestamps: true });
userProgressSchema.index({ userId: 1 }, { unique: true });
userProgressSchema.index({ lastSaveAt: 1 });
userProgressSchema.index({ userId: 1, lastSaveAt: 1 });
userProgressSchema.pre('save', function (next) {
    this.lastSaveAt = Date.now();
    next();
});
// Prevent OverwriteModelError
const UserProgress = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.UserProgress) || mongoose.model('UserProgress', userProgressSchema);
export default UserProgress;
