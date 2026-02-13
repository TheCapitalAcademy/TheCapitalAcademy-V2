import UserAIConfig from '../../models/UserAIConfig.js';

/**
 * Cron job to reset monthly token quotas
 * Run on 1st of every month at 00:00
 */
export const resetMonthlyQuotas = async () => {
    try {
        console.log('[CRON] Starting monthly AI quota reset...');
        
        const configs = await UserAIConfig.find({});
        let resetCount = 0;

        for (const config of configs) {
            const now = new Date();
            const lastReset = config.tokenUsage.lastResetDate;

            // Check if we need to reset (month or year changed)
            if (now.getMonth() !== lastReset.getMonth() || 
                now.getFullYear() !== lastReset.getFullYear()) {
                
                config.tokenUsage.currentMonth = 0;
                config.tokenUsage.lastResetDate = now;
                config.usageHistory.push({
                    tokensUsed: 0,
                    action: 'quota_reset',
                    date: now
                });
                
                await config.save();
                resetCount++;
            }
        }

        console.log(`[CRON] Monthly quota reset complete. Reset ${resetCount} user(s).`);
        return { success: true, resetCount };
    } catch (error) {
        console.error('[CRON] Error resetting monthly quotas:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clean up old usage history (keep last 3 months)
 */
export const cleanupUsageHistory = async () => {
    try {
        console.log('[CRON] Starting usage history cleanup...');
        
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const result = await UserAIConfig.updateMany(
            {},
            {
                $pull: {
                    usageHistory: {
                        date: { $lt: threeMonthsAgo }
                    }
                }
            }
        );

        console.log(`[CRON] Usage history cleanup complete. Modified ${result.modifiedCount} user(s).`);
        return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
        console.error('[CRON] Error cleaning up usage history:', error);
        return { success: false, error: error.message };
    }
};
