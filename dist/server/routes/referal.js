import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import ReferalModel from '../models/referral.js';
import PurchaseModel from '../models/purchase.js';
const referalRouter = express.Router();
// // GET all referral codes
referalRouter.get('/', asyncWrapper(async (req, res) => {
    try {
        const referralCodes = await ReferalModel.find();
        // Extract unique referral codes
        const codeNames = [...new Set(referralCodes.map(referral => referral.code))];
        // Count purchases for each referral code
        const purchaseCounts = await PurchaseModel.aggregate([
            {
                $match: {
                    refCode: { $in: codeNames }
                }
            },
            {
                $group: {
                    _id: "$refCode",
                    count: { $sum: 1 }
                }
            }
        ]);
        // Create a mapping from referral code to purchase count
        const purchaseCountMap = purchaseCounts.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});
        // Include the purchase count in the referral codes response
        const referralCodesWithCounts = referralCodes.map(referral => (Object.assign(Object.assign({}, referral._doc), { purchaseCount: purchaseCountMap[referral.code] || 0 })));
        res.json(referralCodesWithCounts);
    }
    catch (err) {
        res.json({ message: err.message });
    }
}));
//get specfic referal
referalRouter.get('/:promo', asyncWrapper(async (req, res) => {
    try {
        const promo = req.params.promo;
        const referralCodes = await ReferalModel.findOne({ code: promo });
        if (!referralCodes) {
            return res.status(200).json({ status: "Redeem Code Not Found", statusCode: 404 });
        }
        if (new Date() > referralCodes.expireDate) {
            return res.status(200).json({ status: "Redeem Code Expire", statusCode: 401 });
        }
        return res.status(200).send(referralCodes);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}));
// Create a new referral code
referalRouter.post('/', asyncWrapper(async (req, res) => {
    const { code, priceDiscount, expireDate } = req.body;
    const referralCode = new ReferalModel({
        code,
        priceDiscount,
        expireDate
    });
    try {
        const savedReferalModel = await referralCode.save();
        res.status(200).json(savedReferalModel);
    }
    catch (err) {
        res.json("something went wrong");
    }
}));
//DELETE REF CODE
referalRouter.delete('/:id', asyncWrapper(async (req, res) => {
    try {
        const removedRefCode = await ReferalModel.findByIdAndDelete({ _id: req.params.id });
        res.status(200).json(removedRefCode);
    }
    catch (err) {
        res.json({ message: err });
    }
}));
export default referalRouter;
