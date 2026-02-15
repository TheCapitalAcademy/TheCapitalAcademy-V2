var _a;
import mongoose, { Schema } from 'mongoose';
const courseSchema = new Schema({
    cname: {
        type: String,
        enum: ['nums', 'mdcat', 'mdcat+nums'],
        required: true
    },
    cdesc: {
        type: String,
        required: true
    },
    cprice: {
        type: Number,
        required: true
    },
});
// Prevent OverwriteModelError
const CourseModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.Course) || mongoose.model('Course', courseSchema);
export default CourseModel;
