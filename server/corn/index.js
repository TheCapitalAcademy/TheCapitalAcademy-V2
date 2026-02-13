import { checkCourseExpiry } from './jobs/checkCourseExpiry.js';
import { resetMonthlyQuotas, cleanupUsageHistory } from './jobs/resetAIQuotas.js';
import cron from 'node-cron';

export const initCronJobs = () => {
  checkCourseExpiry();
  
  // Reset AI quotas on 1st of every month at 00:00
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Running monthly AI quota reset...');
    await resetMonthlyQuotas();
  });

  // Cleanup old usage history weekly (every Sunday at 02:00)
  cron.schedule('0 2 * * 0', async () => {
    console.log('[CRON] Running AI usage history cleanup...');
    await cleanupUsageHistory();
  });
};
