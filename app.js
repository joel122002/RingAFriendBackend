import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import { satisfiesBaseVersion } from '#root/middleware/utils.js';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin-sdk.json' assert { type: 'json' };
import { authRouter } from '#root/routes/authRouter.js';
import { initializePassport } from '#root/utils/initializePassport.js';
import { profileRouter } from '#root/routes/profileRouter.js';
import { deviceRouter } from '#root/routes/deviceRouter.js';
import { Server } from 'socket.io';
import initializeSocket from '#root/socket.js';

const app = express();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());


const server = app.listen(3000);
const io = new Server(server);

initializePassport(app, io);

initializeSocket(io);

app.use(authRouter);
app.use(profileRouter);
app.use(deviceRouter);
