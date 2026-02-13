import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { authUser } from '../middleware/auth.middleware.js';
import { checkAIQuota } from '../middleware/ai.middleware.js';
import AIService from '../services/ai/aiService.js';
import McqModel from '../models/mcq.js';
import SeriesMCQ from '../models/series/seriesMcq.js';
import UserAIConfig from '../models/UserAIConfig.js';
import { decryptAPIKey } from './aiSettings.js';

const aiExplanationRouter = express.Router();

/**
 * Generate or retrieve explanation for an MCQ
 * POST /api/v1/explanation/generate
 */
aiExplanationRouter.post('/generate', authUser, checkAIQuota, asyncWrapper(async (req, res) => {
    const { mcqId, mcqType = 'MCQ' } = req.body; // mcqType: 'MCQ' or 'SeriesMCQ'
    const userId = req.user.id;
    const aiConfig = req.aiConfig;

    if (!mcqId) {
        return res.status(400).json({ 
            error: 'MCQ ID required',
            message: 'Please provide an MCQ ID'
        });
    }

    try {
        // Fetch the MCQ
        const Model = mcqType === 'SeriesMCQ' ? SeriesMCQ : McqModel;
        const mcq = await Model.findById(mcqId);

        if (!mcq) {
            return res.status(404).json({ 
                error: 'MCQ not found',
                message: 'The requested MCQ does not exist'
            });
        }

        // Check if explanation already exists
        if (mcq.explain && mcq.explain.trim() !== '' && mcq.explain !== 'Explanation Not provided') {
            return res.status(200).json({
                explanation: mcq.explain,
                source: 'database',
                cached: true,
                tokensUsed: 0
            });
        }

        // Generate explanation using AI
        const decryptedKey = decryptAPIKey(aiConfig.apiKey);
        const aiService = new AIService(aiConfig.aiProvider, decryptedKey);
        
        const mcqData = {
            question: mcq.question,
            options: mcq.options,
            correctOption: mcq.correctOption,
            subject: mcq.subject,
            difficulty: mcq.difficulty,
        };

        const result = await aiService.generateExplanation(mcqData);

        // Update token usage
        aiConfig.addUsage(result.tokensUsed, 'explanation_generated', mcqId, mcqType);
        await aiConfig.save();

        // Optionally cache the generated explanation in the database
        if (aiConfig.preferences?.cacheGeneratedExplanations !== false) {
            mcq.explain = result.explanation;
            mcq.aiGenerated = true; // Add flag to track AI-generated explanations
            await mcq.save();
        }

        res.status(200).json({
            explanation: result.explanation,
            source: 'ai_generated',
            cached: false,
            tokensUsed: result.tokensUsed,
            model: result.model,
            remainingQuota: aiConfig.tokenQuota - aiConfig.tokenUsage.currentMonth
        });

    } catch (error) {
        console.error('Explanation generation error:', error);
        
        // Handle specific AI errors
        if (error.message.includes('API key')) {
            return res.status(401).json({ 
                error: 'Invalid API key',
                message: 'Your AI provider API key appears to be invalid. Please update it in settings.'
            });
        }

        if (error.message.includes('rate limit')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: 'Your AI provider rate limit has been exceeded. Please try again later.'
            });
        }

        res.status(500).json({ 
            error: 'Generation failed',
            message: 'Failed to generate explanation. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}));

/**
 * Batch generate explanations (for admin use)
 * POST /api/v1/explanation/batch
 */
aiExplanationRouter.post('/batch', authUser, checkAIQuota, asyncWrapper(async (req, res) => {
    const { mcqIds, mcqType = 'MCQ' } = req.body;
    const userId = req.user.id;
    const aiConfig = req.aiConfig;

    if (!Array.isArray(mcqIds) || mcqIds.length === 0) {
        return res.status(400).json({ 
            error: 'Invalid request',
            message: 'Please provide an array of MCQ IDs'
        });
    }

    if (mcqIds.length > 10) {
        return res.status(400).json({ 
            error: 'Too many requests',
            message: 'Maximum 10 MCQs can be processed at once'
        });
    }

    const results = [];
    const errors = [];
    let totalTokensUsed = 0;

    const Model = mcqType === 'SeriesMCQ' ? SeriesMCQ : McqModel;
    const decryptedKey = decryptAPIKey(aiConfig.apiKey);
    const aiService = new AIService(aiConfig.aiProvider, decryptedKey);

    for (const mcqId of mcqIds) {
        try {
            const mcq = await Model.findById(mcqId);
            
            if (!mcq) {
                errors.push({ mcqId, error: 'MCQ not found' });
                continue;
            }

            // Skip if explanation exists
            if (mcq.explain && mcq.explain.trim() !== '' && mcq.explain !== 'Explanation Not provided') {
                results.push({ 
                    mcqId, 
                    status: 'skipped', 
                    reason: 'Explanation already exists' 
                });
                continue;
            }

            // Check quota before each generation
            if (aiConfig.tokenUsage.currentMonth + totalTokensUsed >= aiConfig.tokenQuota) {
                errors.push({ mcqId, error: 'Quota exceeded' });
                break;
            }

            const mcqData = {
                question: mcq.question,
                options: mcq.options,
                correctOption: mcq.correctOption,
                subject: mcq.subject,
                difficulty: mcq.difficulty,
            };

            const result = await aiService.generateExplanation(mcqData);
            
            mcq.explain = result.explanation;
            mcq.aiGenerated = true;
            await mcq.save();

            totalTokensUsed += result.tokensUsed;
            results.push({ 
                mcqId, 
                status: 'success', 
                tokensUsed: result.tokensUsed 
            });

        } catch (error) {
            errors.push({ mcqId, error: error.message });
        }
    }

    // Update total usage
    if (totalTokensUsed > 0) {
        aiConfig.tokenUsage.currentMonth += totalTokensUsed;
        aiConfig.tokenUsage.totalUsed += totalTokensUsed;
        await aiConfig.save();
    }

    res.status(200).json({
        summary: {
            total: mcqIds.length,
            succeeded: results.filter(r => r.status === 'success').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            failed: errors.length,
            totalTokensUsed
        },
        results,
        errors,
        remainingQuota: aiConfig.tokenQuota - aiConfig.tokenUsage.currentMonth
    });
}));

export default aiExplanationRouter;
