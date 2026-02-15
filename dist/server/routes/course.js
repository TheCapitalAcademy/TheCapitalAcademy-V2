import express from 'express';
import CourseModel from '../models/course.js';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
import { authUser } from '../middleware/auth.middleware.js';
import UserModel from '../models/User.js';
const courseRouter = express.Router();
// for user course status
courseRouter.get('/active-courses', authUser, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user)
            return res.status(401).json({ error: 'User not found' });
        const activeCourses = [];
        if (user.isMdcat) {
            activeCourses.push('mdcat');
        }
        if (user.isNums) {
            activeCourses.push('nums');
        }
        if (user.isMdcatNums) {
            activeCourses.push('mdcatNums');
        }
        if (user.isFreeTrial) {
            activeCourses.push('trial');
        }
        res.status(200).json({
            activeCourses
        });
    }
    catch (err) {
        // console.error(err)
        res.status(500).json({ error: 'Server error' });
    }
});
courseRouter.post('/', asyncWrapper(async (req, res) => {
    const { courseName, courseDescription, coursePrice } = req.body;
    const cname = courseName;
    const cdesc = courseDescription;
    const cprice = coursePrice;
    try {
        // Find the document
        let course = await CourseModel.findOne({ cname });
        if (course) {
            // Update the existing course
            course.cdesc = cdesc;
            course.cprice = cprice;
            await course.save();
            res.status(200).json({ message: `${cname} Course Updated successfully` });
        }
        else {
            // Create a new course
            course = new CourseModel({
                cname,
                cdesc,
                cprice,
            });
            await course.save();
            res.status(200).json({ message: `${cname} Created successfully` });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'An error occurred' });
    }
}));
courseRouter.get('/all', asyncWrapper(async (req, res) => {
    try {
        const course = await CourseModel.find(); // Find the course by cname
        if (course) {
            return res.status(200).send(course); // Send the course if found
        }
        else {
            return res.status(404).json({ error: "Course not found" }); // Return a 404 error if course not found
        }
    }
    catch (error) {
        console.error("Error retrieving course:", error);
        return res.status(500).json({ error: "Internal server error" }); // Return a 500 error for any other errors
    }
}));
courseRouter.get('/:cname', asyncWrapper(async (req, res) => {
    const { cname } = req.params; // Extract the cname parameter from req.params
    try {
        const course = await CourseModel.findOne({ cname }); // Find the course by cname
        if (course) {
            return res.status(200).send(course); // Send the course if found
        }
        else {
            return res.status(404).json({ error: "Course not found" }); // Return a 404 error if course not found
        }
    }
    catch (error) {
        console.error("Error retrieving course:", error);
        return res.status(500).json({ error: "Internal server error" }); // Return a 500 error for any other errors
    }
}));
export default courseRouter;
