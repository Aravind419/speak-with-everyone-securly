const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { parse } = require('url');
const next = require('next');
const { SocketServer } = require('./lib/socket/server');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Check if we should use HTTPS (handle both 'true' string and boolean)
const useHttps = process.env.USE_HTTPS === 'true' || process.env.USE_HTTPS === true;

app.prepare().then(() => {
  if (useHttps) {
    // HTTPS server configuration
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.pem')),
    };

    const httpsServer = createHttpsServer(httpsOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO server
    const socketServer = new SocketServer();
    socketServer.initialize(httpsServer);

    const port = process.env.PORT || 3000;
    httpsServer.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on https://localhost:${port}`);
    });
  } else {
    // HTTP server configuration (default)
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO server
    const socketServer = new SocketServer();
    socketServer.initialize(httpServer);

    const port = process.env.PORT || 3000;
    httpServer.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  }
});