import * as prismaModule from './generated/client/index.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const { PrismaClient } = prismaModule;

let prisma: any;

if (process.env.NODE_ENV === 'production') {
  // Production Mode: Connects securely via Hostinger's local credentials
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'u588391970_admin',
    password: 'sww0lfS0cks2026',
    database: 'u588391970_softwarewolf',
    connectionLimit: 10
  });

  prisma = new PrismaClient({ 
    adapter,
    log: ['error', 'warn']
  });
} else {
  // Local Development Mode: Connects to your local MariaDB instance
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'newadmin',           // Your local database username
    password: 'password',       // Your local database password
    database: 'softwarewolf_home', // Your local database name
    connectionLimit: 5
  });

  prisma = new PrismaClient({ 
    adapter,
    log: ['query', 'error', 'warn'] // Expanded logging to trace local lookups
  });
}

export default prisma;
