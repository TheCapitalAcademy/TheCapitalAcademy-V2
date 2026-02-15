import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import ReportModel from '../models/report.js';
import UserModel from '../models/User.js';
import { authUser } from '../middleware/auth.middleware.js';
const reportRouter = express.Router();
// get all Report
reportRouter.get('/', asyncWrapper(async (req, res) => {
    try {
        const reports = await ReportModel.find().populate('postedBy', 'email username contact');
        const modifiedReports = reports.map(report => {
            const { email, username, contact } = report.postedBy;
            return Object.assign(Object.assign({}, report.toObject()), { email, username, contact });
        });
        res.json(modifiedReports);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
//add new Report
reportRouter.post('/', authUser, asyncWrapper(async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    const report = new ReportModel({
        postedBy: user._id,
        name: user.username,
        msg: req.body.msg,
        question: req.body.question
    });
    try {
        const newReport = await report.save();
        res.status(201).json(newReport);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}));
//get report by id and update isRead to true
reportRouter.get('/:id', asyncWrapper(async (req, res) => {
    try {
        const report = await ReportModel.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        report.isRead = true; // Set isRead to true
        await report.save(); // Save the updated report
        res.json(report);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}));
//delete Report
reportRouter.delete('/:id', asyncWrapper(async (req, res) => {
    try {
        const report = await ReportModel.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json({ message: 'Report deleted' });
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
}));
export default reportRouter;
