import express from 'express'
import mongoose from 'mongoose';
import { offers } from '../models/OffersModel.js';

const router = express.Router();

function isValidString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

// Add new offer
router.post("/", async (request, response) => {
    const { name, description, details } = request.body;  // Include new fields

    if (!isValidString(name) || !isValidString(description)) {
        return response.status(400).send({
            message: 'Name and Description cannot be empty!',
        });
    }

    try {
        const newOffer = { name, description, details };
        const offerResponse = await offers.create(newOffer);
        return response.status(201).json(offerResponse);
    } catch (error) {
        response.status(500).send({ message: 'Failed to create offer' });
    }
});
 
// Read all offers
router.get("/", async (request, response) => {
    try { 
        const allOffers = await offers.find({});
        return response.status(200).json({
            count: allOffers.length,
            data: allOffers
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch offers' });
    }
});

// Read one offer
router.get("/:id", async (request, response) => {
    try {
        const { id } = request.params;  // Extract id from params

        const offer = await offers.findById(id);  // Use findById with id directly
        if (!offer) {
            return response.status(404).send({ message: 'Offer not found' });
        }
        return response.status(200).json(offer);
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch offer' });
    }
});


// Update offer
router.put("/:id", async (request, response) => {
    const { name, description, details } = request.body;
    const { id } = request.params;

    

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).send({ message: 'Invalid ID format' });
    }

    try {
        const updatedOffer = await offers.findByIdAndUpdate(id, { name, description, details }, { new: true });

        if (!updatedOffer) {
            return response.status(404).send({ message: 'Offer not found' });
        }

        return response.status(200).send({ message: 'Offer updated', data: updatedOffer });
    } catch (error) {
        response.status(500).send({ message: 'Failed to update offer' });
    }
});

// Delete offer
router.delete("/:id", async (request, response) => {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(404).send({ message: 'Invalid ID format' });
    }

    try {
        const result = await offers.findByIdAndDelete(id);

        if (!result) {
            return response.status(404).send({ message: 'Offer not found' });
        }

        return response.status(200).send({ message: 'Offer deleted' });
    } catch (error) {
        response.status(500).send({ message: 'Failed to delete offer' });
    }
});



export default router;