import express, { Router } from 'express';
import passport from 'passport';
import { hasFields, satisfiesBaseVersion, validateKeys } from '#root/middleware/utils.js';
import { emailValidator, usernameValidator } from '#root/utils/validators.js';
import * as crypto from 'crypto';
import client from '#root/db.js';

const authRouter = express.Router();

authRouter.post('/login', satisfiesBaseVersion, function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(400);
            return res.send({
                error: 'Incorrect username or password',
            });
        }
        // req / res held in closure
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            res.status(204);
            return res.send();
        });
    })(req, res, next);
});

authRouter.post('/logout', satisfiesBaseVersion, function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.sendStatus(204);
    });
});

authRouter.post(
	'/signup',
	satisfiesBaseVersion,
	hasFields(['username', 'email', 'password']),
	validateKeys(['username', 'email'], [usernameValidator, emailValidator]),
	function (req, res, next) {
		var salt = crypto.randomBytes(16);
		crypto.pbkdf2(
			req.body.password,
			salt,
			310000,
			32,
			'sha256',
			async function (err, hashedPassword) {
				if (err) {
					return next(err);
				}
				try {
					let response = await client.query(
						'INSERT INTO main.users (email, username, hashed_password, salt, join_date) VALUES ($1::varchar, $2, $3::bytea, $4::bytea, current_timestamp) RETURNING *',
						[
							req.body.email,
							req.body.username,
							hashedPassword,
							salt,
						]
					);
					var user = response.rows[0];
					req.login(user, function (err) {
						if (err) {
							return next(err);
						}
						res.status(204);
						res.send();
					});
				} catch (e) {
					if (e.code === '23505') {
						if (e.constraint === 'users_email_key') {
							res.status(400);
							return res.send({
								error: 'Email already exists',
							});
						}
						if (e.constraint === 'users_username_key') {
							res.status(400);
							return res.send({
								error: 'Username already exists',
							});
						}
					}
					console.error(e);
				}
			}
		);
	}
);
export { authRouter };
