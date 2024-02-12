import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import {
    hasFields,
    isAuthenticated,
    validateKeys,
} from './middleware/utils.js';
import admin from 'firebase-admin';
import serviceAccount from './firebase-admin-sdk.json' assert { type: 'json' };
import { getMessaging } from 'firebase-admin/messaging';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import client from './db.js';
import session from 'express-session';
import PGSimple from 'connect-pg-simple';
import pg from 'pg';
import crypto from 'crypto';
import { emailValidator, usernameValidator } from './utils/validators.js';

const app = express();
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

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

app.use(express.json());

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
            res.send({
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
            res.sendStatus(204);
        } catch (e) {
            console.error(e);
            if (e.code === '23505') {
                res.status(400);
                return res.send({
                    error: 'Device already registered',
                });
            }
        }
    }
);

// traditional route handler, passed req/res
app.post('/login', function (req, res, next) {
    // generate the authenticate method (the anonymous method) and
    // associate it with the 'local' strategy
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
app.post('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.sendStatus(204);
    });
});

app.post(
    '/signup',
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
                    console.error(e);
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
                }
            }
        );
    }
);
    });
});

app.listen(3000);
