import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import {
	hasFields,
	isAuthenticated,
	satisfiesBaseVersion,
} from '#root/middleware/utils.js';
import { getMessaging } from 'firebase-admin/messaging';
import client from '#root/db.js';

const deviceRouter = express.Router();

deviceRouter.get(
    '/send-notification/:token',
    satisfiesBaseVersion,
    function (req, res) {
        const token = req.params.token;
        console.log(token, req.params);
        const message = {
            data: {
                message: '',
            },
            token: token,
        };
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
    }
);

deviceRouter.post(
	'/register-device',
	satisfiesBaseVersion,
	isAuthenticated,
	hasFields(['token', 'device_name']),
	async function (req, res) {
		try {
			const body = req.body;
			let response = await client.query(
				'INSERT INTO main.user_devices (user_id, token, device_name) VALUES ($1::uuid, $2::text, $3::varchar) RETURNING *',
				[req.user.id, body.token, body.device_name]
			);
			if (response.rows.length > 0 && response.rows[0]) {
				return res.sendStatus(204);
			}
		} catch (e) {
			if (e.code === '23505') {
				res.status(400);
				return res.send({
					error: 'Device already registered',
				});
			}
			console.error(e);
		}
	}
);

export { deviceRouter };
