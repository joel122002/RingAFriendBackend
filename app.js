import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import {
	hasFields,
	isAuthenticated,
	satisfiesBaseVersion,
	validateKeys,
} from '#root/middleware/utils.js';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin-sdk.json' assert { type: 'json' };
import { getMessaging } from 'firebase-admin/messaging';
import client from '#root/db.js';
import { authRouter } from '#root/routes/authRouter.js';
import { initializePassport } from '#root/utils/initializePassport.js';
import { profileRouter } from '#root/routes/profileRouter.js';

const app = express();
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());

// Check if version is passed
app.use(satisfiesBaseVersion);

initializePassport(app);

app.use('', authRouter);
app.use('', profileRouter);

app.post(
	'/send-notification',
	hasFields(['token', 'message']),
	function (req, res) {
		const body = req.body;
		const message = {
			data: {
				message: body.message,
			},
			token: body.token,
		};
		getMessaging()
			.send(message)
			.then((response) => {
				res.sendStatus(204);
			})
			.catch((error) => {
				res.status(500);
				res.send({
					error: `Error sending message: ${error}`,
				});
			});
	}
);

app.get('/send-notification/:token', function (req, res) {
	const body = req.body;
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
});

app.post(
	'/register-device',
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

app.listen(3000);
