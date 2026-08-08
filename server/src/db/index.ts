// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export type DrizzleDB = typeof db;
export type DrizzleTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DBorTx = DrizzleDB | DrizzleTx;