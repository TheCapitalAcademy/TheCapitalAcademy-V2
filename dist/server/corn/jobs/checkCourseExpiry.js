import cron from 'node-cron';
import PurchaseModel from '../../models/purchase.js';
import UserModel from '../../models/User.js';
import { sendEmail } from '../../helpers/mailer.js';
// Run every 6 hours
export const checkCourseExpiry = () => {
    cron.schedule('* */6 * * *', async () => {
        try {
            const now = new Date();
            const expiredPurchases = await PurchaseModel.find({
                expiryDate: { $lte: now },
                status: 'approved',
            });
            for (const purchase of expiredPurchases) {
                const user = await UserModel.findById(purchase.user);
                if (!user)
                    continue;
                if (purchase.course === 'mdcat') {
                    user.isMdcat = false;
                }
                else if (purchase.course === 'nums') {
                    user.isNums = false;
                }
                else if (purchase.course === 'mdcat+nums') {
                    user.isMdcatNums = false;
                }
                else if (purchase.course === 'trial') {
                    user.isFreeTrial = false;
                    user.freeTrialExpiry = null;
                }
                await user.save();
                await sendEmail({
                    email: user.email,
                    emailType: 'COURSE_EXPIRED',
                    userId: user._id,
                    username: user.username,
                });
                purchase.status = 'expired';
                await purchase.save();
            }
            console.log(`[CRON] Checked and updated expired courses at ${new Date().toISOString()}`);
        }
        catch (err) {
            console.error('[CRON ERROR] checkCourseExpiry:', err);
        }
    });
};
