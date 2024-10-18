const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});

app.set('trust proxy', true);
app.get('/ip', (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.send('requestIP: ' + req.ips);
  console.log('new user: ' + ip.split(',')[0]);
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
