import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const paymentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seriesId: { type: Schema.Types.ObjectId, ref: "Series", required: true },
    currency: { type: String, enum: ["PKR"], default: "PKR" },
    amount: { type: Number, required: true },
    couponCode: { type: String },
    discountApplied: { type: Number, default: 0 },
    status: {
        type: String,
        enum: [
            "created",
            "processing",
            "paid",
            "failed",
            "canceled",
            "refunded",
        ],
        default: "created",
    },
    provider: {
        type: String,
        enum: ["stripe", "manual"],
        default: "manual",
    },
    providerRef: { type: String },
}, { timestamps: true } // auto adds createdAt & updatedAt
);
const Payment = model("Payment", paymentSchema);
export default Payment;
