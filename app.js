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

const app = express();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());

// Check if version is passed
app.use(satisfiesBaseVersion);

const server = app.listen(3000);
const io = new Server(server);

initializePassport(app, io);

io.on('connection', (socket) => {
    const userId = socket.request.user.username;

    socket.on('join', function (room) {
        socket.join(room);
        console.log(`${userId} joined room: ${room}`);
    });

    socket.on('message', function (message) {
        console.log(message);
        io.emit('message', message);
        // socket.disconnect()
    });

    socket.on('messageToGroup', function ({ room, message }) {
        const clients = io.sockets.adapter.rooms.get('Room Name');
        io.to(room).emit('message', message);
        console.log(`${userId} emitted ${message} to ${room}`);
    });
});

app.use(authRouter);
app.use(profileRouter);
app.use(deviceRouter);