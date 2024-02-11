import dotenv from 'dotenv'
dotenv.config()
import pg from 'pg'
const {Client} = pg
const client = new Client({
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    host: process.env.POSTGRESQL_HOST,
    database: process.env.POSTGRESQL_DATABASE
})
await client.connect();

export default client;
