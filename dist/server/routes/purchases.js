import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import PurchaseModel from '../models/purchase.js';
import UserModel from '../models/User.js';
import EarningsModel from '../models/earning.js';
import { authUser } from '../middleware/auth.middleware.js';
const PurchaseRouter = express.Router();
// finalPrice, course, refCode, fileURL 
PurchaseRouter.post('/course', authUser, asyncWrapper(async (req, res) => {
    let { finalPrice, course, refCode, fileURL } = req.body;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (user) {
        finalPrice = parseInt(finalPrice);
        const newPurchase = new PurchaseModel({
            user: userId,
            course: course,
            price: finalPrice,
            refCode,
            purchaseDate: new Date(),
            paymentScreenshot: fileURL
        });
        await newPurchase.save();
        return res.json({ message: "File uploaded", fileURL });
    }
    else {
        res.status(401).json({ error: "User not found." });
    }
}));
// get purchase for user dashbaord
PurchaseRouter.get('/dashboard', authUser, asyncWrapper(async (req, res) => {
    try {
        const documents = await PurchaseModel.find({ user: req.user.id });
        const extractedData = documents.map(doc => {
            const { course, status, price, purchaseDate, expiryDate } = doc;
            return {
                course,
                price,
                purchaseDate,
                status,
                expiryDate
            };
        });
        res.json(extractedData);
    }
    catch (error) {
        console.log(error);
    }
}));
PurchaseRouter.post('/trial', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (user) {
        // Check if the user already has a trial purchase
        const existingTrialPurchase = await PurchaseModel.findOne({ user: userId, course: 'trial' });
        if (existingTrialPurchase) {
            return res.status(400).json({ error: "You already have a trial purchase." });
        }
        const newPurchase = new PurchaseModel({
            user: userId,
            course: 'trial',
            price: 0,
            status: 'approved',
            purchaseDate: new Date(),
            expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days trial
        });
        await newPurchase.save();
        // Update user status for trial
        user.isFreeTrial = true;
        user.freeTrialExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days trial
        await user.save();
        return res.json({ message: "trail activated successfully" });
    }
    else {
        res.status(401).json({ error: "User not found." });
    }
}));
//get all purchases for admin panel
PurchaseRouter.get('/', asyncWrapper(async (req, res, next) => {
    const documents = await PurchaseModel.find({}).populate('user');
    const extractedData = documents.map(doc => {
        const { _id, course, status, price, purchaseDate, paymentScreenshot, expiryDate } = doc;
        const user = doc.user || {}; // Handle cases where user object might be null or missing
        const username = user.username || null;
        const profileUrl = user.image || null;
        return {
            id: _id,
            avatarUrl: profileUrl,
            name: username,
            course,
            price,
            date: purchaseDate,
            status,
            paymentImg: paymentScreenshot,
            expiryDate
        };
    });
    res.json(extractedData);
}));
//get single purchase referalll for admin panel
PurchaseRouter.get('/:id/:days', asyncWrapper(async (req, res, next) => {
    const { id, days } = req.params;
    await PurchaseModel.findOne({ _id: id })
        .then(purchase => {
        const daysToExtend = parseInt(days); // Example: Extend by 90 days
        return purchase.extendExpiryDate(daysToExtend);
    })
        .then(updatedPurchase => {
    })
        .catch(error => {
    });
}));
//handle purchase status for admin panel
PurchaseRouter.put('/:id', asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const purchase = await PurchaseModel.findById(id);
    if (purchase) {
        purchase.status = status;
        await purchase.save();
        try {
            if (purchase.status == 'approved') {
                // const newEarning = new Earnings({
                //     _id: purchase._id,
                //     course: purchase.course,
                //     price: purchase.price,
                // });
                // const edata = await newEarning.save();
                const edata = await Earn.findOneAndUpdate({ _id: purchase._id }, // Query to find the document
                {
                    course: purchase.course,
                    price: purchase.price,
                }, // Update data
                {
                    new: true,
                    upsert: true // Create a new document if none exists
                });
                //find course user and update course status
                const userdata = await userModel.findById(purchase.user);
                if (purchase.course == "mdcat") {
                    userdata.isMdcat = true;
                    await userdata.save();
                }
                else if (purchase.course == "nums") {
                    userdata.isNums = true;
                    await userdata.save();
                }
                else if (purchase.course == "mdcat+nums") {
                    userdata.isMdcatNums = true;
                    await userdata.save();
                }
            }
            else if (purchase.status == 'rejected' || purchase.status == 'pending') {
                const userdata = await userModel.findById(purchase.user);
                if (purchase.course == "mdcat") {
                    userdata.isMdcat = false;
                    await userdata.save();
                }
                else if (purchase.course == "nums") {
                    userdata.isNums = false;
                    await userdata.save();
                }
                else if (purchase.course == "mdcat+nums") {
                    userdata.isMdcatNums = false;
                    await userdata.save();
                }
            }
        }
        catch (error) { }
        res.json({ message: "Status updated." });
    }
    else {
        res.status(404).json({ error: "Purchase not found." });
    }
}));
//handle purchase status for admin [array type]
PurchaseRouter.put('/select/:type', asyncWrapper(async (req, res, next) => {
    const { type } = req.params;
    const { status } = req.body;
    const { collectionsId } = req.body;
    if (type == 'update') {
        try {
            const documentsToUpdate = await PurchaseModel.find({ _id: { $in: collectionsId } });
            for (const document of documentsToUpdate) {
                document.status = status;
                await document.save(); // This will trigger the pre('save') hook
                if (status === 'approved') {
                    const newEarning = new EarningsModel({
                        course: document.course,
                        price: document.price,
                    });
                    await newEarning.save();
                    const userdata = await userModel.findById(document.user);
                    if (userdata) {
                        if (document.course === 'mdcat') {
                            userdata.isMdcat = true;
                        }
                        else if (document.course === 'nums') {
                            userdata.isNums = true;
                        }
                        else if (document.course === 'mdcat+nums') {
                            userdata.isMdcatNums = true;
                        }
                        await userdata.save();
                    }
                }
                else if (status === 'rejected' || status === 'pending') {
                    const userdata = await userModel.findById(document.user);
                    if (userdata) {
                        if (document.course === 'mdcat') {
                            userdata.isMdcat = false;
                        }
                        else if (document.course === 'nums') {
                            userdata.isNums = false;
                        }
                        else if (document.course === 'mdcat+nums') {
                            userdata.isMdcatNums = false;
                        }
                        await userdata.save();
                    }
                }
            }
            res.status(200).json({ message: `${documentsToUpdate.length} items updated successfully.` });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    else if (type == 'delete') {
        const reponse = await PurchaseModel.deleteMany({ _id: { $in: collectionsId } });
        res.status(200).json({ message: `${reponse.deletedCount} purchases deleted successfully.` });
    }
    else if (type == 'extendDate') {
        const days = req.body.days || 0;
        try {
            const documentsToUpdate = await PurchaseModel.find({ _id: { $in: collectionsId } });
            const promises = documentsToUpdate.map(async (document) => {
                const daysToExtend = parseInt(days); // Example: Extend by 90 days
                return document.extendExpiryDate(daysToExtend);
            });
            // Wait for all updates to complete
            await Promise.all(promises);
            res.status(200).json({ message: `${documentsToUpdate.length} items updated successfully.` });
        }
        catch (error) {
            next(error);
        }
    }
    else {
        res.status(400).json({ error: "Invalid operation." });
    }
}));
export default PurchaseRouter;
