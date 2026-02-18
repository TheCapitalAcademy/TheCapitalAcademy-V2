import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import UserModel from '../models/User.js';
import { authUser } from '../middleware/auth.middleware.js';
import UserProgress from '../models/UserProgress.js';
import McqModel from '../models/mcq.js';
import { checkTrialStatus } from '../middleware/course.js';
const progressRouter = express.Router();
progressRouter.post('/get', authUser, checkTrialStatus, asyncWrapper(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let course = (_a = req.body.course) === null || _a === void 0 ? void 0 : _a.trim();
    const subject = (_b = req.body.subject) === null || _b === void 0 ? void 0 : _b.trim();
    const chapter = (_c = req.body.chapter) === null || _c === void 0 ? void 0 : _c.trim();
    const topic = (_d = req.body.topic) === null || _d === void 0 ? void 0 : _d.trim();
    let category = (_e = req.body.category) === null || _e === void 0 ? void 0 : _e.trim(); // past, normal, solved, unsolved, wrong, all
    const userId = req.user.id;
    console.log("category", category);
    const isTrialActive = ((_f = req.user) === null || _f === void 0 ? void 0 : _f.isTrialActive) || false;
    console.log("req user", req.user);
    const isNums = (_g = req.user) === null || _g === void 0 ? void 0 : _g.isNums;
    const isMdcat = (_h = req.user) === null || _h === void 0 ? void 0 : _h.isMdcat;
    let limit = 100;
    limit = isTrialActive
        ? (isMdcat || isNums ? 100 : 2)
        : 100;
    if (course == "trial") {
        limit = 2;
        category = "all";
    }
    if (course == "trial") {
        course = 'mdcat';
    }
    // Resolve mdcatNums combo course to actual DB course per subject
    if (course === 'mdcatNums') {
        if (subject === 'logic') {
            course = 'mdcat';
        }
        else {
            course = 'nums';
        }
    }
    let mcqs = [];
    try {
        if (subject !== 'mock') {
            const queryCriteria = { course, subject, chapter };
            if (subject !== 'english' && subject !== 'logic')
                queryCriteria.topic = topic;
            const pipeline = [{ $match: queryCriteria }];
            let excludedIds = [];
            let includedIds = [];
            // Fetch user progress
            const userProgress = await UserProgress.findOne({ userId });
            if (category === 'solved') {
                includedIds = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.solved) || [];
                pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $in: includedIds } }) });
            }
            else if (category === 'wrong') {
                includedIds = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.wrong) || [];
                pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $in: includedIds } }) });
            }
            else if (category === 'unsolved') {
                const allSolved = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.solved) || [];
                const allWrong = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.wrong) || [];
                excludedIds = [...allSolved, ...allWrong];
                pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $nin: excludedIds } }) });
            }
            else if (category === 'past') {
                pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { category: 'past' }) });
            }
            pipeline.push({ $sample: { size: limit } });
            mcqs = await McqModel.aggregate(pipeline);
            return res.status(200).json(mcqs);
        }
        // Mock test
        else {
            const queryCriteria = { course };
            const sampleSizes = {
                biology: 81,
                chemistry: 45,
                physics: 36,
                english: 9,
                logic: 9
            };
            for (const [subj, size] of Object.entries(sampleSizes)) {
                const subjectMCQs = await McqModel.aggregate([
                    { $match: Object.assign(Object.assign({}, queryCriteria), { subject: subj }) },
                    { $sample: { size } }
                ]);
                mcqs.push(...subjectMCQs);
            }
            return res.status(200).json(mcqs);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while retrieving MCQs', error });
    }
}));
progressRouter.put('/save', authUser, asyncWrapper(async (req, res) => {
    const { correctMcq = [], // MCQs answered correctly
    wrongMcq = [], // MCQs answered incorrectly
    finalSave = false // Whether this is the last save attempt for the session
     } = req.body;
    const userId = req.user.id;
    // Step 1: Remove conflicting entries to avoid duplication
    const pulls = {};
    if (correctMcq.length > 0)
        pulls['wrong'] = { $in: correctMcq };
    if (wrongMcq.length > 0)
        pulls['solved'] = { $in: wrongMcq };
    if (Object.keys(pulls).length > 0) {
        await UserProgress.updateOne({ userId }, { $pull: pulls });
    }
    // Step 2: Add new progress data (both solved and wrong)
    if (correctMcq.length > 0 || wrongMcq.length > 0) {
        await UserProgress.updateOne({ userId }, {
            $addToSet: {
                solved: { $each: correctMcq },
                wrong: { $each: wrongMcq },
            },
            $set: { lastSaveAt: new Date() },
        }, { upsert: true });
    }
    // Step 3: Increment total save count only if it's the final save
    if (finalSave) {
        await UserProgress.updateOne({ userId }, { $inc: { totalSave: 1 } }, { upsert: true });
    }
    return res.status(200).json({ message: 'Progress saved successfully' });
}));
export default progressRouter;
