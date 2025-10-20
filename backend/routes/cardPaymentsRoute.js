import express from 'express';
import cors from 'cors';
import { CardPayment } from '../models/cardPaymentModel.js';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//Route to save a new card payment - client view
router.post('/user', async (request, response) => {
    try {
        if (
            !request.body.CardHolderName ||
            !request.body.CardNumber ||
            !request.body.CVV ||
            !request.body.DateOfExpiry ||
            !request.body.Amount
        ) {
            return response.status(400).send({
                message: 'Send all fields',
            });
        }
        const newCardPayment = {
            CardHolderName: sanitizeHtml(request.body.CardHolderName),
            CardNumber: sanitizeHtml(request.body.CardNumber),
            CVV: sanitizeHtml(request.body.CVV),
            DateOfExpiry: sanitizeHtml(request.body.DateOfExpiry),
            Amount: sanitizeHtml(request.body.Amount),
        };

        const cardPayment = await CardPayment.create(newCardPayment);

        return response.status(201).json(cardPayment);
    } catch (error) {
        response.status(500).send({ message: 'Failed to process card payment' });
    }
});

//Route to get all card payments - client view
router.get('/user', async (request, response) => {
    try {
        const cardPayments = await CardPayment.find({});

        return response.status(200).json({
            count: cardPayments.length,
            data: cardPayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch card payments' });
    }
});

//Route to get all card payments - admin view
router.get('/admin', async (request, response) => {
    try {
        const cardPayments = await CardPayment.find({});

        return response.status(200).json({
            count: cardPayments.length,
            data: cardPayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch card payments' });
    }
});

//Route to get one card payment by id - client view
router.get('/user/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const cardPayment = await CardPayment.findById(id);

        return response.status(200).json(cardPayment);

    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch card payment' });
    }
});

export default router;

// Read payment template

const templatePath = path.join(__dirname, '../templates/PaymentConfirmation.html');

const paymentTemplate = fs.readFileSync(templatePath, 'utf8');

function handlePaymentConfirmation(req, res) {

    const recipientEmail = req.body.Email;

    const dynamicData = {
        // BookingID: await BookingModel.getBookingID(req.body.bookingId),
        // VModel: req.body.VModel,
        // Year: req.body.Year,
        // Pickup_Date: req.body.Pickup_Date,
        // Pickup_Time: req.body.Pickup_Time,
        // ReturnDate: req.body.ReturnDate,
        // ReturnTime: req.body.ReturnTime,
        Amount: req.body.Amount,
        PaymentMethod: 'Card'

    };
    sendPaymentEmail(recipientEmail, dynamicData, paymentTemplate);
}

// exports.handlePaymentConfirmation = handlePaymentConfirmation;
export { handlePaymentConfirmation };