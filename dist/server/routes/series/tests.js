import express from 'express';
const router = express.Router();
import Test from '../../models/series/test.js';
import Series from '../../models/series/series.js';
import SeriesMCQ from '../../models/series/seriesMcq.js';
import { asyncWrapper as wrapAsync } from '../../helpers/asyncWrapper.js';
import { getTestDetails, submitTestAttempt, getTestResults } from '../../controllers/series/test.controller.js';
import { authUser } from '../../middleware/auth.middleware.js';
// const submitTestValidation = [
//     req.body("answers").isArray({ min: 1 }).withMessage("Answers must be a non-empty array"),
//     req.body("answers.*.questionId").isMongoId().withMessage("Each answer must have a valid question ID"),
//     req.body("answers.*.selectedOption").isInt({ min: 0 }).withMessage("Selected option must be a valid number"),
//     req.body("duration").optional().isInt({ min: 0 }).withMessage("Duration must be a positive number"),
// ]
// Test Routes
router.get("/student/:testId", authUser, getTestDetails);
router.post("/student/:testId/submit", authUser, submitTestAttempt);
router.get("/student/:testId/results", authUser, getTestResults);
// ==================== Get all tests for a series
router.get('/series/:seriesId', wrapAsync(async (req, res) => {
    try {
        const tests = await Test.find({ seriesId: req.params.seriesId })
            .populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        res.status(200).json(tests);
    }
    catch (error) {
        console.log('Error fetching tests:', error);
        res.status(500).json({ error: "Failed to fetch tests" });
    }
}));
// Get single test by ID
router.get('/:id', wrapAsync(async (req, res) => {
    try {
        const test = await Test.findById(req.params.id)
            .populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        res.status(200).json(test);
    }
    catch (error) {
        console.log('Error fetching test:', error);
        res.status(500).json({ error: "Failed to fetch test" });
    }
}));
// Create new test
router.post('/', wrapAsync(async (req, res) => {
    var _a, _b;
    try {
        const { seriesId, title, description, subjects, mode, durationMin, totalMarks, availability, questions, isPublished } = req.body;
        // Verify series exists
        const series = await Series.findById(seriesId);
        if (!series) {
            return res.status(404).json({ error: "Series not found" });
        }
        // Process questions - create MCQs first, then link them
        const processedQuestions = [];
        if (questions && questions.length > 0) {
            for (const mcqData of questions) {
                // Validate MCQ data
                if (!mcqData.question || !mcqData.options || !Array.isArray(mcqData.options) || mcqData.options.length !== 4) {
                    throw new Error('Invalid MCQ data: question and 4 options are required');
                }
                if (mcqData.correctOption < 0 || mcqData.correctOption > 3) {
                    throw new Error('Invalid correct option: must be between 0 and 3');
                }
                if (!mcqData.subject || !mcqData.chapter || !mcqData.topic) {
                    throw new Error('Invalid MCQ data: subject, chapter, and topic are required');
                }
                // Normalize subject to lowercase
                const normalizedSubject = mcqData.subject.toLowerCase();
                const validSubjects = ['physics', 'chemistry', 'biology', 'english', 'mathematics', 'logic', 'others'];
                if (!validSubjects.includes(normalizedSubject)) {
                    throw new Error(`Invalid subject: ${mcqData.subject}. Valid subjects are: ${validSubjects.join(', ')}`);
                }
                // Create new Series MCQ
                const mcq = new SeriesMCQ({
                    question: mcqData.question,
                    options: mcqData.options,
                    correctOption: mcqData.correctOption,
                    subject: normalizedSubject,
                    chapter: mcqData.chapter,
                    topic: mcqData.topic,
                    difficulty: mcqData.difficulty || 'easy',
                    category: mcqData.category || 'normal',
                    course: mcqData.course || 'mdcat',
                    info: mcqData.info || '',
                    explain: mcqData.explain || '',
                    imageUrl: mcqData.imageUrl || '',
                    seriesId: seriesId,
                    createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
                });
                await mcq.save();
                // Add to processed questions
                processedQuestions.push({
                    questionId: mcq._id,
                    marks: mcqData.marks || 1
                });
            }
        }
        const test = new Test({
            seriesId,
            title,
            description,
            subjects,
            mode,
            durationMin,
            totalMarks,
            availability,
            questions: processedQuestions,
            isPublished,
            createdBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id
        });
        await test.save();
        // Update MCQs with testId
        if (processedQuestions.length > 0) {
            await SeriesMCQ.updateMany({ _id: { $in: processedQuestions.map(q => q.questionId) } }, { testId: test._id });
        }
        const populatedTest = await Test.findById(test._id)
            .populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        res.status(201).json({ message: "Test created successfully", test: populatedTest });
    }
    catch (error) {
        console.log('Error creating test:', error);
        res.status(500).json({ error: "Failed to create test" });
    }
}));
// Update test
router.put('/:id', wrapAsync(async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { title, description, subjects, mode, durationMin, totalMarks, availability, questions, isPublished } = req.body;
        console.log('Updating test with data:', { title, subjects, mode, durationMin, totalMarks, questionsCount: questions === null || questions === void 0 ? void 0 : questions.length });
        // Get existing test to check current questions
        const existingTest = await Test.findById(req.params.id);
        if (!existingTest) {
            return res.status(404).json({ error: "Test not found" });
        }
        // Process questions - update existing MCQs or create new ones
        const processedQuestions = [];
        if (questions && questions.length > 0) {
            console.log('Processing questions:', questions.length);
            for (const mcqData of questions) {
                console.log('Processing MCQ:', {
                    hasId: !!mcqData._id,
                    idLength: (_a = mcqData._id) === null || _a === void 0 ? void 0 : _a.toString().length,
                    isTemp: (_b = mcqData._id) === null || _b === void 0 ? void 0 : _b.toString().startsWith('temp'),
                    question: ((_c = mcqData.question) === null || _c === void 0 ? void 0 : _c.substring(0, 50)) + '...'
                });
                // Validate MCQ data
                if (!mcqData.question || !mcqData.options || !Array.isArray(mcqData.options) || mcqData.options.length !== 4) {
                    throw new Error('Invalid MCQ data: question and 4 options are required');
                }
                if (mcqData.correctOption < 0 || mcqData.correctOption > 3) {
                    throw new Error('Invalid correct option: must be between 0 and 3');
                }
                if (!mcqData.subject || !mcqData.chapter || !mcqData.topic) {
                    throw new Error('Invalid MCQ data: subject, chapter, and topic are required');
                }
                // Normalize subject to lowercase
                const normalizedSubject = mcqData.subject.toLowerCase();
                const validSubjects = ['physics', 'chemistry', 'biology', 'english', 'mathematics', 'logic', 'others'];
                if (!validSubjects.includes(normalizedSubject)) {
                    throw new Error(`Invalid subject: ${mcqData.subject}. Valid subjects are: ${validSubjects.join(', ')}`);
                }
                let mcq;
                if (mcqData._id && mcqData._id.toString().length === 24 && !mcqData._id.toString().startsWith('temp')) {
                    // Update existing MCQ
                    console.log('Updating existing MCQ:', mcqData._id);
                    mcq = await SeriesMCQ.findByIdAndUpdate(mcqData._id, {
                        question: mcqData.question,
                        options: mcqData.options,
                        correctOption: mcqData.correctOption,
                        subject: normalizedSubject,
                        chapter: mcqData.chapter,
                        topic: mcqData.topic,
                        difficulty: mcqData.difficulty,
                        category: mcqData.category || 'normal',
                        course: mcqData.course || 'mdcat',
                        info: mcqData.info || '',
                        explain: mcqData.explain || '',
                        imageUrl: mcqData.imageUrl || ''
                    }, { new: true });
                    if (!mcq) {
                        console.log('MCQ not found for update:', mcqData._id);
                        throw new Error(`MCQ with ID ${mcqData._id} not found`);
                    }
                }
                else {
                    // Create new MCQ
                    console.log('Creating new MCQ');
                    mcq = new SeriesMCQ({
                        question: mcqData.question,
                        options: mcqData.options,
                        correctOption: mcqData.correctOption,
                        subject: normalizedSubject,
                        chapter: mcqData.chapter,
                        topic: mcqData.topic,
                        difficulty: mcqData.difficulty || 'easy',
                        category: mcqData.category || 'normal',
                        course: mcqData.course || 'mdcat',
                        info: mcqData.info || '',
                        explain: mcqData.explain || '',
                        imageUrl: mcqData.imageUrl || '',
                        seriesId: existingTest.seriesId,
                        testId: existingTest._id,
                        createdBy: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id
                    });
                    await mcq.save();
                    console.log('New MCQ created:', mcq._id);
                }
                // Add to processed questions
                processedQuestions.push({
                    questionId: mcq._id,
                    marks: mcqData.marks || 1
                });
            }
        }
        // Delete MCQs that are no longer in the test
        const existingQuestionIds = existingTest.questions.map(q => q.questionId.toString());
        const newQuestionIds = processedQuestions.map(q => q.questionId.toString());
        const mcqsToDelete = existingQuestionIds.filter(id => !newQuestionIds.includes(id));
        if (mcqsToDelete.length > 0) {
            console.log('Deleting MCQs:', mcqsToDelete);
            await SeriesMCQ.deleteMany({ _id: { $in: mcqsToDelete } });
        }
        console.log('Updating test with processed questions:', processedQuestions.length);
        const test = await Test.findByIdAndUpdate(req.params.id, {
            title,
            description,
            subjects,
            mode,
            durationMin,
            totalMarks,
            availability,
            questions: processedQuestions,
            isPublished
        }, { new: true }).populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        console.log('Test updated successfully');
        res.status(200).json({ message: "Test updated successfully", test });
    }
    catch (error) {
        console.log('Error updating test:', error);
        console.log('Error stack:', error.stack);
        res.status(500).json({ error: "Failed to update test", details: error.message });
    }
}));
// Add MCQ to test
router.post('/:id/mcqs', wrapAsync(async (req, res) => {
    var _a;
    try {
        const { question, options, correctOption, subject, chapter, topic, difficulty, category, course, info, explain, imageUrl, marks } = req.body;
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        // Create new Series MCQ
        const mcq = new SeriesMCQ({
            question,
            options,
            correctOption,
            subject,
            chapter,
            topic,
            difficulty: difficulty || 'easy',
            category: category || 'normal',
            course: course || 'mdcat',
            info: info || '',
            explain: explain || '',
            imageUrl: imageUrl || '',
            seriesId: test.seriesId,
            testId: test._id,
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id
        });
        await mcq.save();
        // Add MCQ to test
        test.questions.push({
            questionId: mcq._id,
            marks: marks || 1
        });
        await test.save();
        const populatedTest = await Test.findById(test._id)
            .populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        res.status(200).json({ message: "MCQ added to test successfully", test: populatedTest });
    }
    catch (error) {
        console.log('Error adding MCQ to test:', error);
        res.status(500).json({ error: "Failed to add MCQ to test" });
    }
}));
// Remove MCQ from test
router.delete('/:id/mcqs/:mcqId', wrapAsync(async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        // Remove MCQ from test questions
        test.questions = test.questions.filter(q => q.questionId.toString() !== req.params.mcqId);
        await test.save();
        // Delete the Series MCQ
        await SeriesMCQ.findByIdAndDelete(req.params.mcqId);
        const populatedTest = await Test.findById(test._id)
            .populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        res.status(200).json({ message: "MCQ removed from test successfully", test: populatedTest });
    }
    catch (error) {
        console.log('Error removing MCQ from test:', error);
        res.status(500).json({ error: "Failed to remove MCQ from test" });
    }
}));
// Delete test
router.delete('/:id', wrapAsync(async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        // Delete associated Series MCQs
        const questionIds = test.questions.map(q => q.questionId);
        if (questionIds.length > 0) {
            await SeriesMCQ.deleteMany({ _id: { $in: questionIds } });
        }
        // Delete the test
        await Test.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Test deleted successfully" });
    }
    catch (error) {
        console.log('Error deleting test:', error);
        res.status(500).json({ error: "Failed to delete test" });
    }
}));
// Publish/Unpublish test
router.patch('/:id/publish', wrapAsync(async (req, res) => {
    try {
        const { isPublished } = req.body;
        const test = await Test.findByIdAndUpdate(req.params.id, { isPublished }, { new: true }).populate('questions.questionId', 'question options correctOption subject chapter topic difficulty category course info explain imageUrl')
            .populate('createdBy', 'username email');
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        res.status(200).json({
            message: `Test ${isPublished ? 'published' : 'unpublished'} successfully`,
            test
        });
    }
    catch (error) {
        console.log('Error publishing test:', error);
        res.status(500).json({ error: "Failed to update test status" });
    }
}));
// Get test statistics
router.get('/:id/stats', wrapAsync(async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        // Here you would typically get test attempt statistics
        // For now, returning basic test info
        res.status(200).json({
            testId: test._id,
            title: test.title,
            totalQuestions: test.questions.length,
            totalMarks: test.totalMarks,
            duration: test.durationMin,
            isPublished: test.isPublished,
            mode: test.mode,
            subjects: test.subjects
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch test statistics" });
    }
}));
export default router;
