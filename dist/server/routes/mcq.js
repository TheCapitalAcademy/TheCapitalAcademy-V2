import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import UserModel from '../models/User.js';
import { authUser } from '../middleware/auth.middleware.js';
import UserProgress from '../models/UserProgress.js';
import McqModel from '../models/mcq.js';
import { checkTrialStatus } from '../middleware/course.js';
const mcqRouter = express.Router();
// Add all McqModels
mcqRouter.post('/add', (req, res) => {
    const mcq = new McqModel(req.body);
    mcq.save().then(() => {
        res.send(mcq);
    }).catch((err) => {
        res.send(err);
    });
});
mcqRouter.post('/get', checkTrialStatus, asyncWrapper(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const course = (_a = req.body.course) === null || _a === void 0 ? void 0 : _a.trim();
    const subject = (_b = req.body.subject) === null || _b === void 0 ? void 0 : _b.trim();
    const chapter = (_c = req.body.chapter) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
    const topic = (_d = req.body.topic) === null || _d === void 0 ? void 0 : _d.trim().toLowerCase();
    const category = (_e = req.body.catagory) === null || _e === void 0 ? void 0 : _e.trim(); // past, normal, solved, unsolved
    const userId = (_f = req.body) === null || _f === void 0 ? void 0 : _f.userId;
    const isTrialActive = (_g = req === null || req === void 0 ? void 0 : req.user) === null || _g === void 0 ? void 0 : _g.isTrialActive;
    const isNums = (_h = req === null || req === void 0 ? void 0 : req.user) === null || _h === void 0 ? void 0 : _h.isNums;
    const isMdcat = (_j = req === null || req === void 0 ? void 0 : req.user) === null || _j === void 0 ? void 0 : _j.isMdcat;
    let limit = 100;
    if (isTrialActive && !isNums && !isMdcat) {
        limit = 5;
    }
    try {
        let mcqs = [];
        if (subject !== 'mock') {
            let queryCriteria = { course, subject, chapter };
            if (subject !== 'english' && subject !== 'logic') {
                queryCriteria.topic = topic;
            }
            try {
                let mcqs;
                let pipeline = [
                    { $match: queryCriteria },
                    { $sample: { size: limit } } // Sample 'limit' number of documents randomly
                ];
                if (category === 'past') {
                    pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { category: category }) });
                }
                else if (category === 'unsolved') {
                    const userSolvedMcqModels = await UserModel.findById(userId).select(['solved_mcqs', 'wrong_mcqs']);
                    const solvedMcqModelIds = userSolvedMcqModels.solved_mcqs;
                    const wrongMcqModelIds = userSolvedMcqModels.wrong_mcqs;
                    pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $nin: [...solvedMcqModelIds, ...wrongMcqModelIds] } }) });
                }
                else if (category === 'solved') {
                    const userSolvedId = await UserModel.findById(userId).select('solved_mcqs');
                    pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $in: userSolvedId.solved_mcqs } }) });
                }
                else if (category === 'wrong') {
                    const userWrongId = await UserModel.findById(userId).select('wrong_mcqs');
                    pipeline.unshift({ $match: Object.assign(Object.assign({}, queryCriteria), { _id: { $in: userWrongId.wrong_mcqs } }) });
                }
                else if (category === 'all') {
                    // No additional match needed, the pipeline already handles this
                }
                mcqs = await McqModel.aggregate(pipeline);
                return res.json(mcqs);
            }
            catch (error) {
                return res.status(500).json({ message: 'An error occurred while retrieving McqModels', error });
            }
        }
        //for mock test
        else if (subject === 'mock') {
            let queryCriteria = { course };
            const sampleSizes = {
                biology: 81,
                chemistry: 45,
                physics: 36,
                english: 9,
                logic: 9
            };
            try {
                for (const [subject, size] of Object.entries(sampleSizes)) {
                    const subjectMcqModels = await McqModel.aggregate([
                        { $match: Object.assign(Object.assign({}, queryCriteria), { subject }) },
                        { $sample: { size } }
                    ]);
                    mcqs.push(...subjectMcqModels);
                }
                return res.status(200).json(mcqs);
            }
            catch (error) {
                return res.status(500).json({ error: 'Failed to fetch McqModels', details: error });
            }
        }
        res.json(mcqs);
    }
    catch (error) {
        res.status(500).send('Internal Server Error');
    }
}));
//delete mcqs data form model database
mcqRouter.delete('/delete', asyncWrapper(async (req, res) => {
    const ids = req.body.ids; // Assuming the request body contains an array of IDs
    if (!Array.isArray(ids)) {
        return res.status(400).json({ message: 'Invalid input: ids should be an array' });
    }
    try {
        const result = await McqModel.deleteMany({ _id: { $in: ids } });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No McqModels found to delete' });
        }
        res.json({ message: `${result.deletedCount} McqModels deleted` });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
//update mcq data
mcqRouter.put('/update', asyncWrapper(async (req, res) => {
    try {
        await McqModel.findByIdAndUpdate(req.body.id, {
            question: req.body.formData.question,
            options: req.body.formData.options,
            correctOption: req.body.formData.correctOption,
            difficulty: req.body.formData.difficulty,
            subject: req.body.formData.subj,
            chapter: req.body.formData.chap,
            category: req.body.formData.category,
            topic: req.body.formData.topic,
            course: req.body.formData.course,
            info: req.body.formData.info,
            explain: req.body.formData.explain,
            imageUrl: req.body.formData.imageUrl,
        });
        res.send("updated");
    }
    catch (error) {
        res.send(error);
    }
}));
//get pages mcqs
mcqRouter.get('/pages', asyncWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 500;
    try {
        const mcqs = await McqModel.find()
            .sort({ subject: 1 }) // Static sort order: descending by createdAt
            .skip((page - 1) * limit)
            .limit(limit);
        const totalCount = await McqModel.countDocuments();
        res.json({
            mcqs,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}));
//get specifc search mcqs
mcqRouter.get('/search', asyncWrapper(async (req, res) => {
    const question = req.query.question;
    try {
        // Use a regular expression to match the question partially
        const mcqs = await McqModel.find({ question: { $regex: question, $options: 'i' } });
        res.json({ mcqs });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
}));
// Diagnostic endpoint to check what chapters/topics exist in DB
mcqRouter.get('/diagnostic/:course/:subject', authUser, asyncWrapper(async (req, res) => {
    try {
        const { course, subject } = req.params;
        // Get unique chapters for this course/subject
        const chapters = await McqModel.distinct('chapter', { course, subject });
        // Get sample topics for each chapter
        const chapterData = [];
        for (const chapter of chapters) {
            const topics = await McqModel.distinct('topic', { course, subject, chapter });
            const count = await McqModel.countDocuments({ course, subject, chapter });
            chapterData.push({ chapter, topics, count });
        }
        res.json({
            course,
            subject,
            totalMcqs: await McqModel.countDocuments({ course, subject }),
            chapters: chapterData
        });
    }
    catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({ error: error.message });
    }
}));
//
mcqRouter.post('/count', authUser, asyncWrapper(async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        let course = (_a = req.body.course) === null || _a === void 0 ? void 0 : _a.trim();
        const subject = (_b = req.body.subject) === null || _b === void 0 ? void 0 : _b.trim();
        const chapter = (_c = req.body.chapter) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase(); // Normalize to lowercase
        const category = (_d = req.body.category) === null || _d === void 0 ? void 0 : _d.trim();
        const topics = ((_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.topic) === null || _f === void 0 ? void 0 : _f.map(t => t.toLowerCase())) || []; // Normalize topics to lowercase
        const userId = req.user.id;
        // Trial users can only access the first chapter of each subject
        if (course === 'trial') {
            const trialAllowedChapters = {
                biology: 'cell & organelles',
                chemistry: 'fundamentals of chemistry',
                physics: 'force & motion',
                english: 'noun',
                logic: 'number & letter series'
            };
            const allowedChapter = trialAllowedChapters[subject];
            if (allowedChapter && chapter !== allowedChapter) {
                return res.status(403).json({ message: 'Trial access is limited to the first chapter only.' });
            }
        }
        console.log('========== MCQ COUNT DEBUG ==========');
        console.log('Received params (normalized):', { course, subject, chapter, category, topics, userId });
        // Resolve mdcatNums combo course to actual DB course per subject
        if (course === 'mdcatNums') {
            if (subject === 'logic') {
                course = 'mdcat';
            }
            else {
                course = 'nums';
            }
        }
        // Now chapter and topics are lowercase, matching the DB format
        let matchCriteria = { course, subject, chapter };
        // Check if ANY MCQs exist for this course/subject/chapter combination (without category filter)
        const rawCount = await McqModel.countDocuments({ course, subject, chapter });
        console.log(`Raw MCQ count in DB for {course: "${course}", subject: "${subject}", chapter: "${chapter}"}: ${rawCount}`);
        // Get actual topic names from DB for this chapter
        if (rawCount > 0) {
            const actualTopics = await McqModel.distinct('topic', { course, subject, chapter });
            console.log('Actual topics in DB:', actualTopics);
            console.log('Searching for topics (normalized):', topics);
            console.log('Topics match check:', topics.map(t => ({
                requested: t,
                exists: actualTopics.includes(t)
            })));
        }
        // Get user progress once
        const userProgress = await UserProgress.findOne({ userId }).select('solved wrong');
        const solvedIds = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.solved) || [];
        const wrongIds = (userProgress === null || userProgress === void 0 ? void 0 : userProgress.wrong) || [];
        console.log(`User progress: ${solvedIds.length} solved, ${wrongIds.length} wrong`);
        // Topic condition (if not english or logic)
        if (subject !== 'english' && subject !== 'logic' && subject !== 'mock') {
            matchCriteria.topic = { $in: topics };
        }
        // Add category filters
        if (category === 'past') {
            matchCriteria.category = 'past';
        }
        else if (category === 'solved') {
            matchCriteria._id = { $in: solvedIds };
        }
        else if (category === 'unsolved') {
            matchCriteria._id = { $nin: [...solvedIds, ...wrongIds] };
        }
        else if (category === 'wrong') {
            matchCriteria._id = { $in: wrongIds };
        }
        // For mock subject: only filter by course + category
        if (subject === 'mock') {
            matchCriteria = { course };
            if (category === 'past') {
                matchCriteria.category = 'past';
            }
            else if (category === 'solved') {
                matchCriteria._id = { $in: solvedIds };
            }
            else if (category === 'unsolved') {
                matchCriteria._id = { $nin: [...solvedIds, ...wrongIds] };
            }
            else if (category === 'wrong') {
                matchCriteria._id = { $in: wrongIds };
            }
        }
        console.log('Final match criteria:', JSON.stringify(matchCriteria, null, 2));
        // ================== Aggregate counts ===================
        const data = await McqModel.aggregate([
            { $match: matchCriteria },
            {
                $group: {
                    _id: subject !== 'english' && subject !== 'logic' ? '$topic' : null,
                    count: { $sum: 1 }
                }
            }
        ]);
        console.log('Aggregation result:', data);
        console.log('====================================');
        // Convert to usable format
        const topicCounts = data.reduce((acc, item) => {
            if (subject !== 'english' && subject !== 'logic') {
                acc[item._id] = item.count;
            }
            else {
                acc.total = (acc.total || 0) + item.count;
            }
            return acc;
        }, {});
        // Final response format
        const result = subject !== 'english' && subject !== 'logic'
            ? topics.map(topic => ({ topic, count: topicCounts[topic] || 0 }))
            : [{ subject, count: topicCounts.total || 0 }];
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
// ===============================stats====================
mcqRouter.get('/stats', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const progress = await UserProgress.findOne({ userId });
    if (!progress) {
        return res.status(200).json({
            totalSolved: 0,
            totalWrong: 0,
            totalSave: 0,
            lastSaveAt: null,
            subjects: []
        });
    }
    const { solved, wrong, totalSave, lastSaveAt } = progress;
    const allMcqIds = [...new Set([...solved, ...wrong])];
    const mcqs = await McqModel.find({ _id: { $in: allMcqIds } }, '_id subject');
    const subjectMap = {};
    mcqs.forEach(mcq => {
        const subject = mcq.subject || 'Unknown';
        if (!subjectMap[subject]) {
            subjectMap[subject] = { subject, solved: 0, wrong: 0 };
        }
        if (solved.includes(mcq._id)) {
            subjectMap[subject].solved += 1;
        }
        if (wrong.includes(mcq._id)) {
            subjectMap[subject].wrong += 1;
        }
    });
    const subjectStats = Object.values(subjectMap);
    res.status(200).json({
        totalSolved: solved.length,
        totalWrong: wrong.length,
        totalSave,
        lastSaveAt,
        subjects: subjectStats
    });
}));
mcqRouter.put('/bookmark', authUser, asyncWrapper(async (req, res) => {
    try {
        const { mcqId } = req.body;
        const userId = req.user.id;
        const user = await UserModel.updateOne({ _id: userId }, {
            $addToSet: { bookmarked_mcqs: mcqId }
        });
        res.json(user);
    }
    catch (error) {
        console.log(error);
    }
}));
mcqRouter.put('/unbookmark', authUser, asyncWrapper(async (req, res) => {
    try {
        const { mcqId } = req.body;
        const userId = req.user.id;
        const user = await UserModel.updateOne({ _id: userId }, {
            $pull: { bookmarked_mcqs: mcqId }
        });
        console.log(user);
        res.json(user);
    }
    catch (error) {
        console.log(error);
    }
}));
mcqRouter.get('/bookmarks', authUser, asyncWrapper(async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId).select('bookmarked_mcqs');
        const mcqs = await McqModel.find({ _id: { $in: user.bookmarked_mcqs } });
        res.json(mcqs);
    }
    catch (error) {
        console.log(error);
    }
}));
export default mcqRouter;
