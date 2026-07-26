/**
 * METRO-FIX: Database Initialization Script
 *
 * Connects to the MSSQL Server's `master` database using credentials from .env,
 * then creates the application database if it does not already exist.
 *
 * Usage:  npx ts-node -r dotenv/config src/scripts/init-db.ts
 */
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '1433', 10);
const DB_USERNAME = process.env.DB_USERNAME || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || 'YourPassword123!';
const DB_NAME = process.env.DB_NAME || 'metrofix_db';

async function initDatabase(): Promise<void> {
  console.log('='.repeat(60));
  console.log('[METRO-FIX] Database Initialization');
  console.log('='.repeat(60));
  console.log(`  Host:     ${DB_HOST}:${DB_PORT}`);
  console.log(`  User:     ${DB_USERNAME}`);
  console.log(`  Target:   ${DB_NAME}`);
  console.log('-'.repeat(60));

  const masterConfig: sql.config = {
    server: DB_HOST,
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: 'master',
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  };

  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('[1/2] Connecting to MSSQL "master" database...');
    pool = await sql.connect(masterConfig);
    console.log('  ✓ Connected to master database.');

    console.log(`[2/2] Ensuring database "${DB_NAME}" exists...`);
    const createDbQuery = `
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${DB_NAME}')
      BEGIN
        CREATE DATABASE [${DB_NAME}];
        PRINT 'Database created successfully.';
      END
      ELSE
      BEGIN
        PRINT 'Database already exists. Skipping creation.';
      END
    `;
    await pool.request().query(createDbQuery);
    console.log(`  ✓ Database "${DB_NAME}" is ready.`);

    console.log('-'.repeat(60));
    console.log('[METRO-FIX] Database initialization complete!');
    console.log('  Next step: Run `npm run start:dev` to synchronize schemas,');
    console.log('  then run `npm run seed` to populate mock data.');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n[ERROR] Database initialization failed:');
    console.error(`  ${error.message}`);
    if (error.code === 'ESOCKET' || error.code === 'ELOGIN') {
      console.error('\n  Troubleshooting:');
      console.error('  - Is SQL Server running on ' + DB_HOST + ':' + DB_PORT + '?');
      console.error('  - Are the SA credentials correct in apps/api/.env?');
      console.error('  - Is TCP/IP enabled in SQL Server Configuration Manager?');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initDatabase();
