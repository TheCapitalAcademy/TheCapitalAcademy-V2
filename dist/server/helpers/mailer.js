import nodemailer from 'nodemailer';
import bcryptjs from 'bcryptjs';
import UserModel from '../models/User.js';
import { generateEmailHTML } from './mail.template.js';
import dotenv from "dotenv";
dotenv.config({
    path: "./.env.local",
}); // 👈
export const sendEmail = async ({ email, emailType, userId, username }) => {
    try {
        // create a hased token
        const hashedToken = await bcryptjs.hash(userId.toString(), 10);
        if (emailType === 'VERIFY') {
            await UserModel.findByIdAndUpdate(userId, {
                verifyToken: hashedToken,
                verifyTokenExpiry: Date.now() + 3600000,
            });
        }
        else if (emailType === 'RESET') {
            await UserModel.findByIdAndUpdate(userId, {
                forgotPasswordToken: hashedToken,
                forgotPasswordTokenExpiry: Date.now() + 3600000,
            });
        }
        // Looking to send emails in production? Check out our Email API/SMTP product!
        // var transport = nodemailer.createTransport({
        // 	host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        // 	port: process.env.SMTP_PORT || 587,
        // 	auth: {
        // 		user: process.env.SMTP_USER || "c8d2a5aabb9f20",
        // 		pass: process.env.SMTP_PASS || "a2f6b5e6c7d1e2",
        // 	}
        // });
        // const transport = nodemailer.createTransport({
        // 	service: "Zoho",
        // 	host: 'smtp.zoho.com',
        // 	port: 465,
        // 	auth: {
        // 		user: 'support@zohoaccounts.com', // Your email address
        // 		pass: 'MbnRRYYgQbwU' // Your email password
        // 	}
        // });
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thecapitalacademy.online@gmail.com',
                pass: 'wnzc ewdg nqtr byhj' // Your email password
            }
        });
        const mailOptions = {
            from: "thecapitalacademy.online@gmail.com",
            to: email,
            subject: emailType === 'VERIFY' ? 'Verify your email'
                : emailType === 'RESET' ? 'Reset your password'
                    : 'Course Expired - Reactivate Now!',
            html: generateEmailHTML({
                type: emailType,
                token: hashedToken,
                domain: process.env.DOMAIN,
                username: username,
            })
        };
        const mailresponse = await transport.sendMail(mailOptions);
        return mailresponse;
    }
    catch (error) {
        throw new Error(error.message);
    }
};
