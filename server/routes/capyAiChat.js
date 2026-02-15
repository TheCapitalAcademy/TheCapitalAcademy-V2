import { Router } from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { authUser } from '../middleware/auth.middleware.js';
import { checkAIQuota } from '../middleware/ai.middleware.js';
import UserAIConfig from '../models/UserAIConfig.js';
import { decryptAPIKey } from './aiSettings.js';

const capyAiChatRouter = Router();

/**
 * Conversation starters for Capy AI
 * GET /api/v1/capy-ai/starters
 */
capyAiChatRouter.get('/starters', authUser, asyncWrapper(async (req, res) => {
    const starters = [
        "Explain the process of mitosis",
        "What is the difference between DNA and RNA?",
        "How does the human digestive system work?",
        "Explain the Krebs cycle in simple terms",
        "What are the types of immunity?",
        "Describe the structure of a cell membrane",
    ];

    res.status(200).json({ starters });
}));

/**
 * Chat with Capy AI (streaming SSE endpoint)
 * POST /api/v1/capy-ai/chat
 *
 * Request body:
 * {
 *   "message": "Explain photosynthesis",
 *   "history": [] // Optional: previous messages
 * }
 */
capyAiChatRouter.post('/chat', authUser, checkAIQuota, asyncWrapper(async (req, res) => {
    const { message, history = [] } = req.body;
    const userId = req.user.id;

    // Validation
    if (!message || message.trim().length === 0) {
        return res.status(400).json({
            error: 'Empty message',
            message: 'Please provide a valid question'
        });
    }

    if (message.length > 1000) {
        return res.status(400).json({
            error: 'Message too long',
            message: 'Please keep your question under 1000 characters'
        });
    }

    // Get user's AI config
    const aiConfig = req.aiConfig; // Attached by checkAIQuota middleware

    // Ensure Gemini is the provider (CapyAI uses Gemini for streaming)
    if (aiConfig.aiProvider !== 'gemini') {
        return res.status(400).json({
            error: 'Gemini required',
            message: 'Capy AI requires Gemini as your AI provider. Please update your AI settings.'
        });
    }

    const decryptedKey = decryptAPIKey(aiConfig.apiKey);

    try {
        const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('@google/generative-ai');

        const genAI = new GoogleGenerativeAI(decryptedKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.95,
                topK: 40,
            },
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // Build prompt with conversation history
        const prompt = buildCapyPrompt(message, history);

        // Set up SSE headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Stream the response
        const result = await model.generateContentStream(prompt);

        let fullText = '';

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullText += chunkText;
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`);
            }
        }

        // Get token usage from the aggregated response
        const response = await result.response;
        const tokensUsed = (response.usageMetadata?.promptTokenCount || 0) +
                          (response.usageMetadata?.candidatesTokenCount || 0);

        // Update token usage
        aiConfig.addUsage(tokensUsed || estimateTokens(prompt + fullText), 'capy_chat', null, null);
        await aiConfig.save();

        // Send done event
        res.write(`data: ${JSON.stringify({
            type: 'done',
            tokensUsed: tokensUsed || estimateTokens(prompt + fullText),
        })}\n\n`);

        res.end();

    } catch (error) {
        console.error('Capy AI chat error:', error);

        // If headers already sent (streaming started), send error via SSE
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: error.message || 'Failed to generate response'
            })}\n\n`);
            res.end();
        } else {
            res.status(500).json({
                error: 'Chat failed',
                message: error.message
            });
        }
    }
}));

/**
 * Build context-aware prompt for Capy AI chat
 */
function buildCapyPrompt(userMessage, conversationHistory) {
    let conversationContext = '';
    if (conversationHistory.length > 0) {
        conversationContext = '\n\n**Previous conversation:**\n';
        conversationHistory.slice(-6).forEach(msg => {
            if (msg.role === 'user') {
                conversationContext += `User: ${msg.content}\n`;
            } else if (msg.role === 'assistant') {
                conversationContext += `AI: ${msg.content}\n\n`;
            }
        });
    }

    return `You are Capy AI, a friendly and knowledgeable MDCAT Biology tutor. Your role is to help students understand biology concepts for their MDCAT preparation.

**Guidelines:**
1. Only answer questions related to MDCAT Biology topics
2. If a question is not related to biology or MDCAT preparation, politely redirect the student
3. Keep your responses clear, concise, and educational
4. Use simple language but maintain scientific accuracy
5. Provide examples when helpful
6. Be encouraging and supportive
${conversationContext}
**Student's Question:**
${userMessage}

**Your Response:**`;
}

/**
 * Estimate token count for usage tracking
 */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

export default capyAiChatRouter;
