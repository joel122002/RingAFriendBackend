import express from 'express';
import {hasFields} from './middleware/utils.js';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin-sdk.json' assert {type: 'json'};
import {getMessaging} from 'firebase-admin/messaging';

const app = express();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());

app.post('/send-notification', hasFields(['token', 'message']), function (req, res) {
    const body = req.body;
    const message = {
        data: {
            message: body.message
        },
        token: body.token,
        priority: 'high'
    };
    getMessaging().send(message).then((response) => {
        res.sendStatus(204);
    }).catch((error) => {
        res.status(500);
        res.send({
            message: `Error sending message: ${error}`
        });
    });
});

app.listen(3000);
