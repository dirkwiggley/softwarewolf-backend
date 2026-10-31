import * as prismaModule from './generated/client/index.js'; // Adjusted path for src/db.ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const { PrismaClient } = prismaModule;

// FIXED: Initialize the MariaDB adapter using a proper configuration object structure
const adapter = new PrismaMariaDb({
  host: 'localhost', // Safely leverages Hostinger's local loopback channel
  port: 3306,
  user: 'u588391970_admin',
  password: 'sww0lfS0cks2026',
  database: 'u588391970_softwarewolf',
  connectionLimit: 10
});

// Instantiate your secure Prisma Client engine wrapper with the corrected driver adapter attached.
const prisma = new PrismaClient({ 
  adapter,
  log: ['error', 'warn']
});

export default prisma;
