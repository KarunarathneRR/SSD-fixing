import express from 'express';
import { PaymentMethod } from '../models/paymentMethodModel.js';
import sanitizeHtml from 'sanitize-html';

const router = express.Router();

//Route to save payment method - client view
router.post('/user', async (request, response) => {
    try {
        if (
            !request.body.PaymentMethod ||
            !request.body.CardNumber ||
            !request.body.CVV ||
            !request.body.DateOfExpiry 
        ) {
            return response.status(400).send({
                message: 'Send all fields',
            });
        }
        const savePaymentMethod = {
            PaymentMethod: sanitizeHtml(request.body.PaymentMethod),
            CardNumber: sanitizeHtml(request.body.CardNumber),
            CVV: sanitizeHtml(request.body.CVV),
            DateOfExpiry: sanitizeHtml(request.body.DateOfExpiry),
        };

        const paymentMethod = await PaymentMethod.create(savePaymentMethod);

        return response.status(201).json(paymentMethod);
    } catch (error) {
        response.status(500).send({ message: 'Failed to save payment method' });
    }
});

//Route to get payment method by id - client view
router.get('/user/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const paymentMethod = await PaymentMethod.findById(id);

        return response.status(200).json(paymentMethod);

    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch payment method' });
    }
});

//Route to update payment method - client view
router.put('/user/:id', async (request, response) => {
    try {
        if (
            !request.body.PaymentMethod ||
            !request.body.CardNumber ||
            !request.body.CVV ||
            !request.body.DateOfExpiry
        ) {
            return response.status(400).send({
                message: 'Send all fields',
            });
        }

        const { id } = request.params;

        const result = await PaymentMethod.findByIdAndUpdate(id, request.body);

        if (!result) {
            return response.status(404).json({ message: 'Payment Method not found' });

        }
        return response.status(200).send({ message: 'Payment Method updated' });

    } catch (error) {
        response.status(500).send({ message: 'Failed to update payment method' });
    }
});

//Route to delete payment method - client view
router.delete('/user/:id', async (request, response) => {
    try {
        const { id } = request.params;

        const result = await PaymentMethod.findByIdAndDelete(id);

        if (!result) {
            return response.status(404).json({ message: 'Payment Method not found' });

        }
        return response.status(200).send({ message: 'Payment Method deleted' });

    } catch (error) {
        response.status(500).send({ message: 'Failed to delete payment method' });
    }
});

//Route to get all clients' payment methods - admin view
router.get('/admin', async (request, response) => {
    try {
        const paymentMethods = await PaymentMethod.find({});

        return response.status(200).json({
            count: paymentMethods.length,
            data: paymentMethods
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch payment methods' });
    }
});

//Route to get all clients' payment methods - client view
router.get('/user', async (request, response) => {
    try {
        const paymentMethods = await PaymentMethod.find({});

        return response.status(200).json({
            count: paymentMethods.length,
            data: paymentMethods
        });
    } catch (error) {
        response.status(500).send({ message: 'Failed to fetch payment methods' });
    }
});

export default router;