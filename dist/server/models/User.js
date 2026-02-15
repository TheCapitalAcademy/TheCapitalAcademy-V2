var _a;
import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
    },
    email: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true,
    },
    password: String,
    image: {
        type: String,
        default: null
    },
    provider: String,
    providerId: String,
    isVerfied: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
        default: 'user'
    },
    //courses schemas
    isMdcat: {
        type: Boolean,
        default: false,
        required: false,
    },
    isNums: {
        type: Boolean,
        default: false,
        required: false,
    },
    isMdcatNums: {
        type: Boolean,
        default: false,
        required: false,
    },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phone: { type: String, default: null },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male',
    },
    dob: { type: Date, default: null, required: false },
    isFreeTrial: { type: Boolean, default: false },
    freeTrialExpiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    city: { type: String, default: null },
    aggPercentage: {
        type: Number,
        required: false,
    },
    bookmarked_mcqs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MCQ' }],
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    usernameChangeAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
// userSchema.pre('save', async function (next) {
// 	if (this.role === 'admin') {
// 		const adminExists = await mongoose.models.User.findOne({ role: 'admin' })
// 		if (adminExists) {
// 			throw new Error('An admin already exists.')
// 		}
// 	}
// 	next()
// });
// Prevent OverwriteModelError
const UserModel = ((_a = mongoose === null || mongoose === void 0 ? void 0 : mongoose.models) === null || _a === void 0 ? void 0 : _a.User) || mongoose.model('User', userSchema);
export default UserModel;
