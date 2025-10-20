import express from 'express';
import cors from 'cors';
import { StripePayment } from '../models/stripePaymentModel.js';
import { STRIPE_SECRET_KEY } from '../config.js';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import sendPaymentEmail from '../index.js';

const router = express.Router();

//Route to save a new Stripe payment - client view
router.post('/user', async (request, response) => {
    try {
        if (
            !request.body.CardNumber ||
            !request.body.CVV ||
            !request.body.DateOfExpiry ||
            !request.body.Amount
        ) {
            return response.status(400).send({
                message: 'Send all fields',
            });
        }
        const newStripePayment = {
            CardNumber: sanitizeHtml(request.body.CardNumber),
            CVV: sanitizeHtml(request.body.CVV),
            DateOfExpiry: sanitizeHtml(request.body.DateOfExpiry),
            Amount: sanitizeHtml(request.body.Amount),
        };

        const stripePayment = await StripePayment.create(newStripePayment);

        return response.status(201).json(stripePayment);
    } catch (error) {
        response.status(500).send({ message: 'Failed to create stripe payment' });
    }
});

//Route to get all Stripe payments - client view
router.get('/user', async (request, response) => {
    try {
        const stripePayments = await StripePayment.find({});

        return response.status(200).json({
            count: stripePayments.length,
            data: stripePayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch stripe payments' });
    }
});

//Route to get all Stripe payments - admin view
router.get('/admin', async (request, response) => {
    try {
        const stripePayments = await StripePayment.find({});

        return response.status(200).json({
            count: stripePayments.length,
            data: stripePayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch stripe payments' });
    }
});

//Route to get one stripe payment by id - client view
router.get('/user/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const stripePayment = await StripePayment.findById(id);

        return response.status(200).json(stripePayment);

    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch stripe payment' });
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
        PaymentMethod: 'Stripe'

    };
    sendPaymentEmail(recipientEmail, dynamicData, paymentTemplate);
}

// exports.handlePaymentConfirmation = handlePaymentConfirmation;
export { handlePaymentConfirmation };