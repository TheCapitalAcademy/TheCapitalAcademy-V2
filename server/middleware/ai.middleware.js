import UserAIConfig from '../models/UserAIConfig.js';

/**
 * Middleware to check if user has AI quota remaining
 */
export const checkAIQuota = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please log in to use AI features'
            });
        }

        // Get user's AI configuration
        const aiConfig = await UserAIConfig.findOne({ userId });

        if (!aiConfig) {
            return res.status(404).json({ 
                error: 'AI configuration not found',
                message: 'Please configure your AI settings first',
                action: 'setup_required'
            });
        }

        // Check if feature is enabled
        if (!aiConfig.isEnabled) {
            return res.status(403).json({ 
                error: 'AI feature disabled',
                message: 'AI explanation generation is currently disabled for your account'
            });
        }

        // Check if API key is configured
        if (!aiConfig.apiKey || aiConfig.aiProvider === 'none') {
            return res.status(403).json({ 
                error: 'API key not configured',
                message: 'Please add your AI provider API key in settings',
                action: 'api_key_required'
            });
        }

        // Reset monthly usage if needed
        aiConfig.resetMonthlyUsage();

        // Check quota
        if (!aiConfig.hasQuotaRemaining()) {
            return res.status(429).json({ 
                error: 'Quota exceeded',
                message: 'You have reached your monthly token quota',
                usage: {
                    current: aiConfig.tokenUsage.currentMonth,
                    limit: aiConfig.tokenQuota,
                    resetsAt: new Date(
                        aiConfig.tokenUsage.lastResetDate.getFullYear(),
                        aiConfig.tokenUsage.lastResetDate.getMonth() + 1,
                        1
                    )
                }
            });
        }

        // Attach AI config to request
        req.aiConfig = aiConfig;
        next();
    } catch (error) {
        console.error('AI quota check error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to check AI quota'
        });
    }
};

/**
 * Middleware to validate AI provider and API key format
 */
export const validateAIProvider = (req, res, next) => {
    const { aiProvider, apiKey } = req.body;

    if (aiProvider !== 'gemini') {
        return res.status(400).json({ 
            error: 'Invalid provider',
            message: 'Only Google Gemini is supported'
        });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
        return res.status(400).json({ 
            error: 'Invalid API key',
            message: 'Please provide a valid API key'
        });
    }

    if (!apiKey.startsWith('AIza')) {
        return res.status(400).json({ 
            error: 'Invalid Gemini API key',
            message: 'Google Gemini API keys should start with "AIza"'
        });
    }

    next();
};
