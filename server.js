const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { Card } = require('./public/js/Card');

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// make the public folder public for files to refrerence eachother
app.use(express.static('public'))

// handle get request
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const players = {};

io.on('connection', (socket) => {
  console.log('a user ' + socket.id + ' connected');
  players[socket.id] = {};

  socket.on('set name', (recivedName) => {
    players[socket.id] = { name: recivedName };
    io.emit('update players', players);
    console.log('user ' + socket.id + ' set name to: ' + recivedName);
    console.log(players);
  });
  socket.on('get Card', () => {
    socket.emit('recive Card', new Card(FARBE.EICHEL,WERT.KOENIG));
  });

  socket.on('disconnect', (reason) => {
    delete players[socket.id];
    io.emit('update players', players);
    console.log('user disconnected because of: ' + reason);
  });

  /* future chat feature
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  */
});

// IP feature
app.set('trust proxy', true);
app.get('/ip', (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.send('requestIP: ' + req.ips);
  console.log('new user: ' + ip.split(',')[0]);
});

// server listening on Port 3000(default set in environment variables)
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});