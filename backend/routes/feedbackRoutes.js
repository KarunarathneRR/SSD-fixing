import express from 'express';
import mongoose from 'mongoose';
import { feedbacks } from '../models/feedbackModel.js'; // Assuming the model file is named 'FeedbackModel.js' and exports a model named 'Feedback'

const router = express.Router();

function isValidString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

// Add new feedback
router.post("/", async (request, response) => {
    const { name, email, details } = request.body;

    if (!isValidString(name) || !isValidString(email) || !isValidString(details)) {
        return response.status(400).json({
             message: 'All fields must be filled!'
        });
    }

    try {
        const newFeedback = { name, email, details };
        const feedbackResponse = await feedbacks.create (newFeedback);
        return response.status(201).json(feedbackResponse);
    } catch (error) {
        return response.status(500).json({ message: 'Failed to create feedback' });
    }
});

// Read all feedbacks
router.get("/", async (request, response) => {
    try {
        const allFeedbacks = await feedbacks.find({});
        return response.status(200).json({
            count: allFeedbacks.length,
            data: allFeedbacks
        });
    } catch (error) {
        return response.status(500).json({ message: 'Failed to fetch feedbacks' });
    }
});

// Read one feedback
router.get("/:id", async (request, response) => {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ message: 'Invalid ID format' });
    }
    
    try {
        const feedback = await feedbacks.findById(id);
        if (!feedback) {
            return response.status(404).json({ message: 'Feedback not found' });
        }
        return response.status(200).json(feedback);
    } catch (error) {
        return response.status(500).json({ message: 'Failed to fetch feedback' });
    }
});

// Update feedback
router.put("/:id", async (request, response) => {
    const { name, email, details } = request.body;
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ message: 'Invalid ID format' });
    }

    try {
        const updatedFeedback = await feedbacks.findByIdAndUpdate(
            id,
            { name, email, details },
            { new: true }
        );

        if (!updatedFeedback) {
            return response.status(404).json({ message: 'Feedback not found' });
        }

        return response.status(200).json({ message: 'Feedback updated', data: updatedFeedback });
    } catch (error) {
        return response.status(500).json({ message: 'Failed to update feedback' });
    }
});

// Delete feedback
router.delete("/:id", async (request, response) => {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).json({ message: 'Invalid ID format' });
    }

    try {
        const result = await feedbacks.findByIdAndDelete(id);
        if (!result) {
            return response.status(404).json({ message: 'Feedback not found' });
        }

        return response.status(200).json({ message: 'Feedback deleted' });
    } catch (error) {
        return response.status(500).json({ message: 'Failed to delete feedback' });
    }
});




  


export default router;
