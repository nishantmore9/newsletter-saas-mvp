import app from './app.js';
import dotenv from 'dotenv';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

dotenv.config();
const PORT = env.PORT;

const startServer = async () => {
  try {
    // 1. Ping the database to ensure it is actively accepting connections
    await db.execute(sql`SELECT 1`);
    logger.info('Database connected successfully');

    // 2. Start the Express server ONLY if the database is ready
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // 3. Fail-Fast: Log the error and shut down the Node process
    logger.error('Database connection failed. Shutting down server...', error);
    process.exit(1);
  }
};

startServer();