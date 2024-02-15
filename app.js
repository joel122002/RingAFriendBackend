import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import {
	satisfiesBaseVersion,
} from '#root/middleware/utils.js';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin-sdk.json' assert { type: 'json' };
import { authRouter } from '#root/routes/authRouter.js';
import { initializePassport } from '#root/utils/initializePassport.js';
import { profileRouter } from '#root/routes/profileRouter.js';
import { deviceRouter } from '#root/routes/deviceRouter.js';

const app = express();
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());

// Check if version is passed
app.use(satisfiesBaseVersion);

initializePassport(app);

app.use(authRouter);
app.use(profileRouter);
app.use(deviceRouter);

app.listen(3000);