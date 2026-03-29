import dotenv from 'dotenv'
dotenv.config()
import pg from 'pg'
const {Pool} = pg
const pool = new Pool({
    user: process.env.POSTGRESQL_USER,
    password: process.env.POSTGRESQL_PASSWORD,
    host: process.env.POSTGRESQL_HOST,
    database: process.env.POSTGRESQL_DATABASE
})

export default pool;
