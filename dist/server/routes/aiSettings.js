import express from 'express';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { authUser } from '../middleware/auth.middleware.js';
import { validateAIProvider } from '../middleware/ai.middleware.js';
import UserAIConfig from '../models/UserAIConfig.js';
import crypto from 'crypto';
const aiSettingsRouter = express.Router();
// Encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_SECRET || 'your-32-character-secret-key!!';
/**
 * Simple encryption for API keys (use proper encryption in production)
 */
function encryptAPIKey(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
function decryptAPIKey(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Get user's AI configuration
 * GET /api/v1/ai-settings
 */
aiSettingsRouter.get('/', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    let aiConfig = await UserAIConfig.findOne({ userId });
    // Create default config if doesn't exist
    if (!aiConfig) {
        aiConfig = new UserAIConfig({ userId });
        await aiConfig.save();
    }
    // Reset monthly usage if needed
    aiConfig.resetMonthlyUsage();
    await aiConfig.save();
    res.status(200).json({
        aiProvider: aiConfig.aiProvider,
        hasApiKey: !!aiConfig.apiKey,
        isEnabled: aiConfig.isEnabled,
        preferences: aiConfig.preferences,
    });
}));
/**
 * Update AI provider and API key
 * PUT /api/v1/ai-settings/provider
 */
aiSettingsRouter.put('/provider', authUser, validateAIProvider, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const { aiProvider, apiKey } = req.body;
    let aiConfig = await UserAIConfig.findOne({ userId });
    if (!aiConfig) {
        aiConfig = new UserAIConfig({ userId });
    }
    // Encrypt API key before storing
    const encryptedKey = encryptAPIKey(apiKey);
    aiConfig.aiProvider = aiProvider;
    aiConfig.apiKey = encryptedKey;
    aiConfig.isEnabled = true;
    await aiConfig.save();
    res.status(200).json({
        message: 'AI provider updated successfully',
        aiProvider: aiConfig.aiProvider,
        hasApiKey: true,
    });
}));
/**
 * Remove API key
 * DELETE /api/v1/ai-settings/provider
 */
aiSettingsRouter.delete('/provider', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const aiConfig = await UserAIConfig.findOne({ userId });
    if (!aiConfig) {
        return res.status(404).json({
            error: 'Configuration not found',
            message: 'No AI configuration found for this user'
        });
    }
    aiConfig.apiKey = null;
    aiConfig.aiProvider = 'none';
    aiConfig.isEnabled = false;
    await aiConfig.save();
    res.status(200).json({
        message: 'API key removed successfully'
    });
}));
/**
 * Update user preferences
 * PUT /api/v1/ai-settings/preferences
 */
aiSettingsRouter.put('/preferences', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const { autoGenerate, maxTokensPerExplanation, preferredModel } = req.body;
    let aiConfig = await UserAIConfig.findOne({ userId });
    if (!aiConfig) {
        aiConfig = new UserAIConfig({ userId });
    }
    if (typeof autoGenerate === 'boolean') {
        aiConfig.preferences.autoGenerate = autoGenerate;
    }
    if (maxTokensPerExplanation && maxTokensPerExplanation >= 100 && maxTokensPerExplanation <= 1000) {
        aiConfig.preferences.maxTokensPerExplanation = maxTokensPerExplanation;
    }
    if (preferredModel) {
        aiConfig.preferences.preferredModel = preferredModel;
    }
    await aiConfig.save();
    res.status(200).json({
        message: 'Preferences updated successfully',
        preferences: aiConfig.preferences
    });
}));
/**
 * Get usage history
 * GET /api/v1/ai-settings/usage-history
 */
aiSettingsRouter.get('/usage-history', authUser, asyncWrapper(async (req, res) => {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;
    const aiConfig = await UserAIConfig.findOne({ userId })
        .populate('usageHistory.mcqId', 'question subject');
    if (!aiConfig) {
        return res.status(404).json({
            error: 'Configuration not found',
            message: 'No AI configuration found'
        });
    }
    const history = aiConfig.usageHistory
        .sort((a, b) => b.date - a.date)
        .slice(skip, skip + limit);
    res.status(200).json({
        total: aiConfig.usageHistory.length,
        history
    });
}));
/**
 * Test API key (verify it works before saving)
 * POST /api/v1/ai-settings/test-key
 */
aiSettingsRouter.post('/test-key', authUser, validateAIProvider, asyncWrapper(async (req, res) => {
    const { aiProvider, apiKey } = req.body;
    try {
        const AIService = (await import('../services/ai/aiService.js')).default;
        const aiService = new AIService(aiProvider, apiKey);
        // Test with a simple MCQ
        const testMcq = {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctOption: 2,
            subject: "mathematics",
            difficulty: "easy"
        };
        const result = await aiService.generateExplanation(testMcq);
        res.status(200).json({
            success: true,
            message: 'API key is valid and working',
            testResult: {
                explanation: result.explanation,
                tokensUsed: result.tokensUsed,
                model: result.model
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: 'API key validation failed',
            message: error.message
        });
    }
}));
// Export decryption function for use in other modules
export { decryptAPIKey };
export default aiSettingsRouter;
