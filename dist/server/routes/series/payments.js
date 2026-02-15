import express from 'express';
const router = express.Router();
import { asyncWrapper as wrapAsync } from '../../helpers/asyncWrapper.js';
import Payment from '../../models/series/orders.js';
import Series from '../../models/series/series.js';
import { authUser } from '../../middleware/auth.middleware.js';
// Get all payments
router.get('/all', wrapAsync(async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'username email')
            .populate('seriesId', 'title slug');
        res.status(200).json(payments);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
}));
router.post('/purchase-series', authUser, wrapAsync(async (req, res) => {
    const { id: userId, email } = req.user;
    try {
        const { seriesId, providerRef, couponCode = '', discountApplied = 0, provider = 'manual', } = req.body;
        // Verify series exists
        const series = await Series.findById(seriesId);
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        const payment = new Payment({
            userId,
            seriesId,
            amount: series.price,
            couponCode,
            discountApplied: discountApplied || 0,
            provider: provider || 'manual',
            providerRef
        });
        await payment.save();
        res.status(201).json({ message: "Payment created successfully", payment });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create payment" });
    }
}));
// =============for admin side ===============
// Get payments for a specific series
router.get('/series/:seriesId', wrapAsync(async (req, res) => {
    try {
        const payments = await Payment.find({ seriesId: req.params.seriesId })
            .populate('userId', 'username email');
        res.status(200).json(payments);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
}));
// Get payments for a specific user
router.get('/user/:userId', wrapAsync(async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId })
            .populate('seriesId', 'title slug');
        res.status(200).json(payments);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch payments" });
    }
}));
// Create new payment
router.post('/', wrapAsync(async (req, res) => {
    try {
        const { userId, seriesId, currency, amount, couponCode, discountApplied, provider, providerRef } = req.body;
        // Verify series exists
        const series = await Series.findById(seriesId);
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        const payment = new Payment({
            userId,
            seriesId,
            currency: currency || 'PKR',
            amount,
            couponCode,
            discountApplied: discountApplied || 0,
            provider: provider || 'manual',
            providerRef
        });
        await payment.save();
        res.status(201).json({ message: "Payment created successfully", payment });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create payment" });
    }
}));
// Update payment status
router.patch('/:id/status', wrapAsync(async (req, res) => {
    try {
        const { status } = req.body;
        const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        res.status(200).json({
            message: `Payment status updated to ${status}`,
            payment
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update payment status" });
    }
}));
// Update payment
router.put('/:id', wrapAsync(async (req, res) => {
    try {
        const { currency, amount, couponCode, discountApplied, status, provider, providerRef } = req.body;
        const payment = await Payment.findByIdAndUpdate(req.params.id, {
            currency,
            amount,
            couponCode,
            discountApplied,
            status,
            provider,
            providerRef
        }, { new: true });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        res.status(200).json({ message: "Payment updated successfully", payment });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update payment" });
    }
}));
// Delete payment
router.delete('/:id', wrapAsync(async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        res.status(200).json({ message: "Payment deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete payment" });
    }
}));
// Get payment statistics
router.get('/stats/overview', wrapAsync(async (req, res) => {
    var _a;
    try {
        const [totalPayments, paidPayments, pendingPayments, failedPayments] = await Promise.all([
            Payment.countDocuments(),
            Payment.countDocuments({ status: 'paid' }),
            Payment.countDocuments({ status: 'created' }),
            Payment.countDocuments({ status: 'failed' })
        ]);
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        res.status(200).json({
            totalPayments,
            paidPayments,
            pendingPayments,
            failedPayments,
            totalRevenue: ((_a = totalRevenue[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch payment statistics" });
    }
}));
// Get revenue by series
router.get('/stats/revenue-by-series', wrapAsync(async (req, res) => {
    try {
        const revenueBySeries = await Payment.aggregate([
            { $match: { status: 'paid' } },
            {
                $lookup: {
                    from: 'series',
                    localField: 'seriesId',
                    foreignField: '_id',
                    as: 'series'
                }
            },
            {
                $group: {
                    _id: '$seriesId',
                    seriesTitle: { $first: '$series.title' },
                    totalRevenue: { $sum: '$amount' },
                    paymentCount: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        res.status(200).json(revenueBySeries);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch revenue statistics" });
    }
}));
export default router;
