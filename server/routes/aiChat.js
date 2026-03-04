import { Router } from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { authUser } from '../middleware/auth.middleware.js';
import { checkAIQuota } from '../middleware/ai.middleware.js';
import UserAIConfig from '../models/UserAIConfig.js';
import McqModel from '../models/mcq.js';
import SeriesMCQ from '../models/series/seriesMcq.js';
import { decryptAPIKey } from './aiSettings.js';

const aiChatRouter = Router();

/**
 * Chat with AI about a specific MCQ
 * POST /api/v1/ai-chat/message
 * 
 * Request body:
 * {
 *   "mcqId": "64abc...",
 *   "mcqType": "MCQ" | "SeriesMCQ",
 *   "message": "Can you explain more about...",
 *   "conversationHistory": [] // Optional: previous messages in this conversation
 * }
 */
aiChatRouter.post('/message', authUser, checkAIQuota, asyncWrapper(async (req, res) => {
    const { mcqId, mcqType, message, conversationHistory = [] } = req.body;
    const userId = req.user.id;

    // Validation
    if (!mcqId || !mcqType || !message) {
        return res.status(400).json({
            error: 'Missing required fields',
            message: 'Please provide mcqId, mcqType, and message'
        });
    }

    if (message.trim().length === 0) {
        return res.status(400).json({
            error: 'Empty message',
            message: 'Please provide a valid question'
        });
    }

    if (message.length > 500) {
        return res.status(400).json({
            error: 'Message too long',
            message: 'Please keep your question under 500 characters'
        });
    }

    // Get MCQ data
    const Model = mcqType === 'SeriesMCQ' ? SeriesMCQ : McqModel;
    const mcq = await Model.findById(mcqId);

    if (!mcq) {
        return res.status(404).json({
            error: 'MCQ not found',
            message: 'The requested MCQ does not exist'
        });
    }

    // Get user's AI config
    const aiConfig = req.aiConfig; // Attached by checkAIQuota middleware
    const decryptedKey = decryptAPIKey(aiConfig.apiKey);

    try {
        // Import AI service
        const AIService = (await import('../services/ai/aiService.js')).default;
        const aiService = new AIService(aiConfig.aiProvider, decryptedKey);

        // Build context-aware prompt
        const prompt = buildChatPrompt(mcq, message, conversationHistory);

        // Generate response
        const result = await aiService.generateChatResponse(prompt);

        // Check if response is off-topic
        if (isOffTopicResponse(result.explanation)) {
            return res.status(200).json({
                response: "I can only answer questions related to this MCQ and its explanation. Please ask something about the question, options, or the concept being tested.",
                tokensUsed: result.tokensUsed,
                isOffTopic: true
            });
        }

        // Update user's token usage
        aiConfig.addUsage(result.tokensUsed, 'chat_message', mcqId, mcqType);
        await aiConfig.save();

        res.status(200).json({
            response: result.explanation,
            model: result.model,
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat failed',
            message: error.message
        });
    }
}));

/**
 * Build context-aware prompt for chat
 */
function buildChatPrompt(mcq, userMessage, conversationHistory) {
    const optionLabels = ['A', 'B', 'C', 'D'];
    const formattedOptions = mcq.options
        .map((opt, idx) => `${optionLabels[idx]}) ${opt}`)
        .join('\n');

    const correctLabel = optionLabels[mcq.correctOption - 1];
    const correctText = mcq.options[mcq.correctOption - 1];

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
        conversationContext = '\n\n**Previous conversation:**\n';
        conversationHistory.slice(-4).forEach(msg => { // Keep last 4 messages for context
            conversationContext += `User: ${msg.user}\nAI: ${msg.ai}\n\n`;
        });
    }

    return `You are an expert educator helping a student understand a specific MCQ. You must ONLY answer questions directly related to this MCQ, its explanation, or the underlying concept. If the student asks anything off-topic (like other subjects, general knowledge, personal questions, etc.), politely redirect them to ask about the current MCQ.

**MCQ Context:**
Subject: ${mcq.subject || 'General'}
Difficulty: ${mcq.difficulty || 'Medium'}

**Question:**
${mcq.question}

**Options:**
${formattedOptions}

**Correct Answer:** ${correctLabel}) ${correctText}

**Explanation:**
${mcq.explain || 'No explanation provided yet.'}
${conversationContext}
**Student's Question:**
${userMessage}

**Your Response:**
Answer the student's question ONLY if it relates to this MCQ, its explanation, or the concept being tested. If off-topic, respond with: "I can only help with questions about this specific MCQ. Please ask about the question, options, or the concept being tested."

Keep your response concise (3-5 sentences) and educational.
For any mathematical expressions, formulas, numbers with units, or chemical formulas, wrap them with dollar signs for inline math. For example: $22.4 \text{ L}$, $\frac{44.8}{22.4} = 2$, $H_2O$. Always use LaTeX math notation with $...$ delimiters — never use raw LaTeX commands outside of dollar-sign delimiters.`;
}

/**
 * Check if AI response indicates off-topic query
 */
function isOffTopicResponse(response) {
    const offTopicIndicators = [
        'cannot help with that',
        'not related to this mcq',
        'only help with questions about this',
        'off-topic',
        'outside the scope',
        'not about this question'
    ];

    const lowerResponse = response.toLowerCase();
    return offTopicIndicators.some(indicator => lowerResponse.includes(indicator));
}

/**
 * Get chat suggestions based on MCQ
 * GET /api/v1/ai-chat/suggestions/:mcqId
 */
aiChatRouter.get('/suggestions/:mcqId', authUser, asyncWrapper(async (req, res) => {
    const { mcqId } = req.params;
    const { mcqType = 'MCQ' } = req.query;

    const Model = mcqType === 'SeriesMCQ' ? SeriesMCQ : McqModel;
    const mcq = await Model.findById(mcqId);

    if (!mcq) {
        return res.status(404).json({
            error: 'MCQ not found'
        });
    }

    // Generate contextual suggestions
    const suggestions = [
        "Can you explain this in simpler terms?",
        "Why are the other options incorrect?",
        "What's the key concept I should remember?",
        "Can you give me a real-world example?",
        "How would I solve similar questions?"
    ];

    res.status(200).json({
        suggestions
    });
}));

export default aiChatRouter;
