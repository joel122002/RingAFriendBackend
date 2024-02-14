import passport from 'passport';
import session from 'express-session';
import PGSimple from 'connect-pg-simple';
import crypto from 'crypto';
import LocalStrategy from 'passport-local';
import pg from 'pg';
import dotenv from 'dotenv';
import client from '#root/db.js';

dotenv.config();

export function initializePassport(app) {
	passport.use(
		new LocalStrategy(async function verify(username, password, cb) {
			try {
				const res = await client.query(
					'SELECT * FROM main.users WHERE username = $1::text;',
					[username]
				);
				if (!res.rows || !res.rows.length > 0) {
					return cb(null, false, {
						error: 'Incorrect username or password.',
					});
				}
				const row = res.rows[0];
				crypto.pbkdf2(
					password,
					row.salt,
					310000,
					32,
					'sha256',
					function (err, hashedPassword) {
						if (err) {
							return cb(err);
						}
						if (
							!crypto.timingSafeEqual(
								row.hashed_password,
								hashedPassword
							)
						) {
							return cb(null, false, {
								error: 'Incorrect username or password.',
							});
						}
						return cb(null, row);
					}
				);
			} catch (err) {
				return cb(err);
			}
		})
	);

	passport.serializeUser(function (user, cb) {
		process.nextTick(function () {
			cb(null, { id: user.id, username: user.username });
		});
	});

	passport.deserializeUser(function (user, cb) {
		process.nextTick(function () {
			return cb(null, user);
		});
	});
	const pgPool = new pg.Pool({
		connectionString: `postgres://${process.env.POSTGRESQL_USER}:${process.env.POSTGRESQL_PASSWORD}@${process.env.POSTGRESQL_HOST}/${process.env.POSTGRESQL_DATABASE}`,
	});
	app.use(
		session({
			store: new (PGSimple(session))({
				pool: pgPool,
			}),
			secret: process.env.COOKIE_SECRET,
			resave: false,
			cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
			// Insert express-session options here
		})
	);

	app.use(passport.initialize());
	app.use(passport.session());
}
