import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import {
    isAuthenticated,
    satisfiesBaseVersion,
} from '#root/middleware/utils.js';
import { getMessaging } from 'firebase-admin/messaging';
import client from '#root/db.js';

const profileRouter = express.Router();

profileRouter.get(
    '/profile',
    isAuthenticated,
    satisfiesBaseVersion,
    async function (req, res) {
        const response = await client.query(
            'SELECT * FROM main.users WHERE id = $1::uuid;',
            [req.user.id]
        );
        const row = response.rows[0];
        if (row) {
            return res.send({
                username: row.username,
                join_date: row.join_date,
            });
        }
        return res.send(
            {
                error: 'User does not exist',
            },
            400
        );
    }
);

profileRouter.get('/send-to-user/:username', function (req, res) {
    const username = req.params.username;
    var userMessage = req.body.message;
    if (!userMessage) {
        userMessage = '';
    }
    const message = {
        data: { username: username, message: userMessage },
        topic: `${username}`,
        android: {
            priority: 'high',
        },
    };
    console.log(message);
    getMessaging()
        .send(message)
        .then((response) => {
            res.sendStatus(204);
        })
        .catch((error) => {
            res.status(500);
            return res.send({
                error: `Error sending message: ${error}`,
            });
        });
});

profileRouter.get(
    '/get-all-users',
    satisfiesBaseVersion,
    isAuthenticated,
    async function (req, res) {
        const username = req.user.username;
        const response = await client.query(
            'SELECT username FROM main.users WHERE username <> $1;',
            [username]
        );
        const row = response.rows;
        return res.send(row);
    }
);

export { profileRouter };
