import express from 'express';
import { Home } from '../models/common.js';
import { asyncWrapper } from '../helpers/asyncWrapper.js';
const commonRouter = express.Router();
commonRouter.post('/topbar', asyncWrapper(async (req, res) => {
    const { tcontent } = req.body;
    try {
        // Find the document
        let find = await Home.findOne();
        if (find) {
            await Home.updateOne({}, { tcontent });
        }
        else {
            // If document not found, create a new one
            find = new Home({ tcontent });
            await find.save();
        }
        res.status(200).json({ message: 'Success' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}));
commonRouter.get('/topbar', asyncWrapper(async (req, res) => {
    const data = await Home.findOne();
    res.status(200).send(data);
}));
export default commonRouter;
