import express from 'express';
import cors from 'cors';
import { CashPayment } from '../models/cashPaymentModel.js';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';
// import sendPaymentEmail from '../index.js';

const router = express.Router();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Route to save a new cash payment - client view
router.post('/user', async (request, response) => {
    try {
        if (
            !request.body.ReceiptNo ||
            !request.body.PaymentDate ||
            !request.body.Status ||
            !request.body.Amount
        ) {
            return response.status(400).send({
                message: 'Send all fields',
            });
        }
        const newCashPayment = {
            ReceiptNo: sanitizeHtml(request.body.ReceiptNo),
            Date: sanitizeHtml(request.body.PaymentDate),
            Status: sanitizeHtml(request.body.Status),
            Amount: sanitizeHtml(request.body.Amount),
        };

        const cashpayment = await CashPayment.create(newCashPayment);

        return response.status(201).json(cashpayment);
    } catch (error) {
        response.status(500).send({ message: 'Failed to create cash payment' });
    }
});

//Route to get all cash payments - client view
router.get('/user', async (request, response) => {
    try {
        const cashPayments = await CashPayment.find({});

        return response.status(200).json({
            count: cashPayments.length,
            data: cashPayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch cash payments' });
    }
});

//Route to get all cash payments - admin view
router.get('/admin', async (request, response) => {
    try {
        const cashPayments = await CashPayment.find({});

        return response.status(200).json({
            count: cashPayments.length,
            data: cashPayments
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch cash payments' });
    }
});

//Route to get one cash payment by id - client view
router.get('/user/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const cashPayment = await CashPayment.findById(id);

        return response.status(200).json(cashPayment);

    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch cash payment' });
    }
});

//Route to update a cash payment - admin view
router.put('/admin/:id', async (request, response) => {
    try {
        const { Status } = request.body;
        const { ReceiptNo } = request.body;

        if (!Status || !ReceiptNo) {
            return response.status(400).send({
                message: 'Send Status and ReceiptNo field',
            });
        }

        const { id } = request.params;

        const result = await CashPayment.findByIdAndUpdate(id, { Status, ReceiptNo });

        if (!result) {
            return response.status(404).json({ message: 'Cash Payment not found' });

        }
        return response.status(200).send({ message: 'Cash Payment updated' });
    } catch (error) {
        response.status(500).send({ message: 'Failed to update cash payment' });
    }
});

//Route to get one cash payment by id - admin view
router.get('/admin/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const cashPayment = await CashPayment.findById(id);

        return response.status(200).json(cashPayment);

    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch cash payment' });
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
        PaymentMethod: 'Cash'

    };
    sendPaymentEmail(recipientEmail, dynamicData, paymentTemplate);
}

// exports.handlePaymentConfirmation = handlePaymentConfirmation;
export { handlePaymentConfirmation };