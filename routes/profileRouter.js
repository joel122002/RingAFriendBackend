import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import { isAuthenticated } from '#root/middleware/utils.js';
import { getMessaging } from 'firebase-admin/messaging';
import client from '#root/db.js';

const profileRouter = express.Router();

profileRouter.get('/profile', isAuthenticated, async function (req, res) {
	const response = await client.query(
		'SELECT * FROM main.users WHERE id = $1::uuid;',
		[req.user.id]
	);
	const row = response.rows[0];
	return res.send({
		username: row.username,
		join_date: row.join_date,
	});
});

profileRouter.get('/send-to-user/:username', function (req, res) {
	const username = req.params.username;
	const message = {
		data: {
			message: '',
		},
		topic: `${username}`,
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

profileRouter.get('/get-all-users', isAuthenticated, async function (req, res) {
	const response = await client.query('SELECT username FROM main.users;');
	const row = response.rows;
	return res.send(row);
});

export { profileRouter };
