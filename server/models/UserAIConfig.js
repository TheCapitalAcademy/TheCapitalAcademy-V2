import mongoose from 'mongoose';

const userAIConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    
    // AI Provider Configuration
    aiProvider: {
        type: String,
        enum: ['openai', 'anthropic', 'gemini', 'none'],
        default: 'none',
    },
    
    // Encrypted API key (use encryption in production)
    apiKey: {
        type: String,
        default: null,
    },
    
    // Token Usage Tracking
    tokenUsage: {
        currentMonth: {
            type: Number,
            default: 0,
        },
        lastResetDate: {
            type: Date,
            default: Date.now,
        },
        totalUsed: {
            type: Number,
            default: 0,
        },
    },
    
    // Monthly Token Quota
    tokenQuota: {
        type: Number,
        default: 50000, // 50k tokens/month (adjustable per user)
    },
    
    // Usage History
    usageHistory: [{
        date: {
            type: Date,
            default: Date.now,
        },
        tokensUsed: Number,
        action: String, // 'explanation_generated', 'quota_reset', etc.
        mcqId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'usageHistory.mcqType',
        },
        mcqType: {
            type: String,
            enum: ['MCQ', 'SeriesMCQ'],
        },
    }],
    
    // Feature Flags
    isEnabled: {
        type: Boolean,
        default: true,
    },
    
    // Settings
    preferences: {
        autoGenerate: {
            type: Boolean,
            default: true, // Auto-generate explanations when missing
        },
        maxTokensPerExplanation: {
            type: Number,
            default: 300,
        },
        preferredModel: String, // 'gpt-4o-mini', 'claude-3-5-haiku', etc.
    },
    
}, { timestamps: true });

// Index for efficient queries
userAIConfigSchema.index({ userId: 1 });

// Method to check if user has quota remaining
userAIConfigSchema.methods.hasQuotaRemaining = function() {
    return this.tokenUsage.currentMonth < this.tokenQuota;
};

// Method to reset monthly usage (call via cron job)
userAIConfigSchema.methods.resetMonthlyUsage = function() {
    const now = new Date();
    const lastReset = this.tokenUsage.lastResetDate;
    
    // Check if a month has passed
    if (now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
        this.tokenUsage.currentMonth = 0;
        this.tokenUsage.lastResetDate = now;
        this.usageHistory.push({
            tokensUsed: 0,
            action: 'quota_reset',
        });
    }
};

// Method to add token usage
userAIConfigSchema.methods.addUsage = function(tokensUsed, action, mcqId, mcqType) {
    this.tokenUsage.currentMonth += tokensUsed;
    this.tokenUsage.totalUsed += tokensUsed;
    this.usageHistory.push({
        tokensUsed,
        action: action || 'explanation_generated',
        mcqId,
        mcqType,
    });
};

const UserAIConfig = mongoose.models.UserAIConfig || mongoose.model('UserAIConfig', userAIConfigSchema);

export default UserAIConfig;
