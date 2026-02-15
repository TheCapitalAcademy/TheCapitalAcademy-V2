import express from 'express';
import ReviewModel from '../models/reviews.js';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
const reviewRouter = express.Router();
// post router review
reviewRouter.post('/', asyncWrapper(async (req, res) => {
    const review = new ReviewModel({
        name: req.body.name,
        comment: req.body.comment,
        city: req.body.city
    });
    await review.save();
    res.status(200).json({
        message: "added"
    });
}));
// get router review
reviewRouter.get('/', asyncWrapper(async (req, res) => {
    const reviews = await ReviewModel.find();
    res.send(reviews);
}));
//edit reviews
reviewRouter.put('/:id', asyncWrapper(async (req, res) => {
    const review = await ReviewModel.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        comment: req.body.comment,
        city: req.body.city
    }, { new: true });
    if (!review)
        return res.status(404).send('The review with the given ID was not found');
    res.send(review);
}));
// delete reviews
reviewRouter.delete('/:id', asyncWrapper(async (req, res) => {
    const review = await ReviewModel.findByIdAndDelete(req.params.id);
    if (!review)
        return res.status(404).send('The review with the given ID was not found');
    res.send(review);
}));
export default reviewRouter;
