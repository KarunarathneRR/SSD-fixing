import express from "express";
import mongoose from "mongoose";
import sanitizeHtml from "sanitize-html";

import cardPaymentsRoute from './routes/cardPaymentsRoute.js';
import cashPaymentsRoute from './routes/cashPaymentsRoute.js';
import paymentMethodRoute from './routes/paymentMethodRoute.js';
import refundRequestsRoute from './routes/refundRequestsRoute.js';
import stripePaymentsRoute from './routes/stripePaymentsRoute.js';
import fs from 'fs';
import offersRoutes from './routes/offersRoutes.js';


import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { PORT, mongoDBURL } from './config.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import rentHisRoute from './routes/rentHisRoute.js';
import authRouter from './routes/authRoute.js';
import LicenseRepository from './controllers/LicenseRepository.js';
import InsuranceRepository from './controllers/InsuranceRepository.js';

import recordsRoute from './routes/recordsRoute.js'

// const carRoutes = require('./routes/carRoute');
import carRoutes from './routes/carRoute.js'

import booksRoute from './routes/booksRoute.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
dotenv.config();

const app = express();

app.use(express.json());

// Trust proxy for correct protocol detection behind reverse proxies (e.g., Vercel)
app.set('trust proxy', 1);

// Additional modern header (not handled by helmet): Permissions-Policy
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=(self)',
        'usb=()'
    ].join(', '));
    next();
});

// const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
//     .split(',')
//     .map(s => s.replace(/\/$/, '').trim());

const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',  // Added for React dev server
    'http://127.0.0.1:3000',  // Added for React dev server
];

const envOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map(s => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Host header allow-list derived from allowedOrigins (defense against LAN/DNS rebinding)
const parseHost = (s) => {
    try { return new URL(s).hostname; } catch { return s.replace(/^https?:\/\//, '').split(':')[0]; }
};
const defaultHosts = ['localhost', '127.0.0.1'];
const envHosts = envOrigins.map(parseHost).filter(Boolean);
const allowedHosts = Array.from(new Set([...defaultHosts, ...envHosts]));

// Block requests with unexpected Host header in non-production
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        const hostHeader = (req.headers.host || '').split(':')[0];
        if (!allowedHosts.includes(hostHeader)) {
            return res.status(400).send('Invalid Host header');
        }
    }
    next();
});

app.use(cors({
    origin(origin, cb) {
        // Reject requests with no origin in production for security
        if (!origin) {
            // Allow in development, reject in production
            if (process.env.NODE_ENV === 'production') {
                return cb(new Error('Origin not allowed'), false);
            }
            return cb(null, true);
        }
        // Normalize incoming origin (strip trailing slash)
        const normalized = origin.replace(/\/$/, '');

        if (allowedOrigins.includes(normalized)) {
            return cb(null, true);
        }
        // Reject unauthorized origins without exposing internal information
        return cb(new Error('Origin not allowed'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400, // Cache preflight requests for 24 hours
}));

// Security headers specifically for Google OAuth
app.use((req, res, next) => {
    // Essential for Google OAuth popup/redirect flow
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

    // Additional security headers that don't interfere with OAuth
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');

    // Referrer policy that works with OAuth
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Additional modern header: Permissions-Policy
    res.setHeader('Permissions-Policy', [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=(self)',
        'usb=()'
    ].join(', '));

    // Add strict Content Security Policy (CSP)
    const cspDirectives = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "script-src 'self' https://accounts.google.com https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        `connect-src 'self' ${allowedOrigins.join(' ')} https://accounts.google.com https://apis.google.com`,
        "font-src 'self' data:",
        "frame-src https://accounts.google.com",
        "upgrade-insecure-requests"
    ].join('; ');
    res.header('Content-Security-Policy', cspDirectives);

    next();
});

// Handle preflight requests explicitly
app.options('*', cors());

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
app.use('/uploads', express.static('uploads'));

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.get('/', (req, res) => res.status(200).send('Welcome'));
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);
app.use('/vehicle', vehicleRoutes);
app.use('/admin', adminRoutes);
app.use('/rents', rentHisRoute);
app.use('/cardpayments', cardPaymentsRoute);
app.use('/cashpayments', cashPaymentsRoute);
app.use('/savepaymentmethod', paymentMethodRoute);
app.use('/refundrequests', refundRequestsRoute);
app.use('/stripepayments', stripePaymentsRoute);
app.use('/api/auth', authRouter);
app.use('/records', recordsRoute);

app.use('/offers', offersRoutes);


// Use car routes
app.use('/cars', carRoutes);


app.use('/books', booksRoute);

app.use('/feedbacks', feedbackRoutes);
// MongoDB connection
mongoose.connect(mongoDBURL || process.env.DB_URI)
    .then(() => {
        console.log('MongoDB connected');
        const port = PORT || process.env.PORT;
        const bindAddress = process.env.BIND_ADDRESS || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
        app.listen(port, bindAddress, () => {
            console.log(`Server running on http://${bindAddress}:${port}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error');
        process.exit(1);
    });

// Scheduled tasks
cron.schedule('0 7 * * *', async () => {
    console.log('Running daily tasks at 7:00 AM...');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Handle license expirations
    const licenses = await LicenseRepository.getAllLicenses();
    licenses.forEach(async (license) => {
        const endDate = new Date(license.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) <= 7) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: license.email,
                subject: 'License Expiry Reminder',
                text: `Hello, your license will expire on ${endDate.toDateString()}. Please renew it promptly.`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error while sending mail:', error);
                } else {
                    console.log('Mail sent:', info.response);
                }
            });
        }
    });

    // Handle insurance expirations
    const insurances = await InsuranceRepository.getAllInsurances();
    insurances.forEach(async (insurance) => {
        const endDate = new Date(insurance.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) <= 7) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: insurance.email,
                subject: 'Insurance Expiry Reminder',
                text: `Hello, your insurance will expire on ${endDate.toDateString()}. Please renew it promptly.`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error while sending mail:', error);
                } else {
                    console.log('Mail sent:', info.response);
                }
            });
        }
    });
});


// License API routes
app.post('/licenses', upload.single('uploadLicense'), async (req, res) => {
    try {
        const newLicense = await LicenseRepository.addLicense({
            vehicleNo: sanitizeHtml(req.body.vehicleNo || ""),
            startDate: sanitizeHtml(req.body.startDate || ""),
            endDate: sanitizeHtml(req.body.endDate || ""),
            uploadLicense: req.file ? req.file.path : null,
            email: sanitizeHtml(req.body.email || ""),
            notes: sanitizeHtml(req.body.notes || "")
        });
        res.status(201).json(newLicense);
    } catch (error) {
        console.error('Error when adding license');
        res.status(500).send({ message: 'Failed to add license' });
    }
});

app.get('/licenses', async (req, res) => {
    try {
        const licenses = await LicenseRepository.getAllLicenses();
        res.send(licenses);
    } catch (error) {
        res.status(500).send({ message: 'Failed to fetch licenses' });
    }
});

app.put('/licenses/:id', async (req, res) => {
    try {
        const updatedLicense = await LicenseRepository.updateLicense(req.params.id, req.body);
        res.json(updatedLicense);
    } catch (error) {
        res.status(500).send({ message: 'Failed to update license' });
    }
});

app.delete('/licenses/:id', async (req, res) => {
    try {
        const deletedLicense = await LicenseRepository.deleteLicense(req.params.id);
        res.json(deletedLicense);
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete license' });
    }
});

// Insurance API routes
app.post('/insurances', upload.single('uploadInsurance'), async (req, res) => {
    try {
        const newInsurance = await InsuranceRepository.addInsurance({
            vehicleNo: sanitizeHtml(req.body.vehiclenumber),
            insuranceProvider: sanitizeHtml(req.body.insuranceProvider),
            policyNumber: sanitizeHtml(req.body.policyNumber),
            policyType: sanitizeHtml(req.body.policyType),
            coverageDetails: sanitizeHtml(req.body.coverageDetails),
            startDate: sanitizeHtml(req.body.startDate),
            endDate: sanitizeHtml(req.body.endDate),
            premiumAmount: sanitizeHtml(req.body.premiumAmount),
            contactInformation: sanitizeHtml(req.body.contactInformation),
            uploadInsurance: req.file ? req.file.path : null,
            email: sanitizeHtml(req.body.email),
        });
        res.status(201).json(newInsurance);
    } catch (error) {
        console.error('Error when adding insurance');
        res.status(500).send({ message: 'Failed to add insurance' });
    }
});

app.get('/insurances', async (req, res) => {
    try {
        const insurances = await InsuranceRepository.getAllInsurances();
        res.json(insurances);
    } catch (error) {
        res.status(500).send({ message: 'Failed to fetch insurances' });
    }
});

app.put('/insurances/:id', async (req, res) => {
    try {
        const updatedInsurance = await InsuranceRepository.updateInsurance(req.params.id, req.body);
        res.json(updatedInsurance);
    } catch (error) {
        res.status(500).send({ message: 'Failed to update insurance' });
    }
});

app.delete('/insurances/:id', async (req, res) => {
    try {
        const deletedInsurance = await InsuranceRepository.deleteInsurance(req.params.id);
        res.json(deletedInsurance);
    } catch (error) {
        res.status(500).send({ message: 'Failed to delete insurance' });
    }
});
export default app;