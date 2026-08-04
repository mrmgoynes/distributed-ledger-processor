import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Max concurrent connections allowed
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
