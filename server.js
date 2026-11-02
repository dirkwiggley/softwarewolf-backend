const path = require('path');
const { createServer } = require('http');

const PORT = process.env.PORT || 3000;
process.env.NODE_ENV = 'production';
const currentRoot = __dirname;

const nextServerPath = path.join(currentRoot, 'apps/web/.next/standalone/apps/web/server.js');
console.log(`[Root Server] Initializing Next.js Standalone rendering engine from: ${nextServerPath}`);

const NextServerModule = require(nextServerPath);
const nextHandler = NextServerModule.handler || NextServerModule;

const server = createServer((req, res) => {
  return nextHandler(req, res);
});

server.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`> Frontend Production Engine active on Port: ${PORT}`);
});