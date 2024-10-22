const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

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
  socket.on('start game', () => {
    console.log('game started');
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

class Card {
  constructor(number, color) {
      this.number = number;
      this.color = color;
  }
  /*
  toString(){
      return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
  }
  */
  toString() {
      switch (this.color) {
          case 1:
              switch (this.number) {
                  case 1:
                      return "🃗";
                  case 2:
                      return "🃛";
                  case 3:
                      return "🃝";
                  case 4:
                      return "🃞";
                  case 5:
                      return "🃚";
                  case 6:
                      return "🃑";
              }
              break;
          case 2:
              switch (this.number) {
                  case 1:
                      return "🂧";
                  case 2:
                      return "🂫";
                  case 3:
                      return "🂭";
                  case 4:
                      return "🂮";
                  case 5:
                      return "🂪";
                  case 6:
                      return "🂡";
              }
              break;
          case 3:
              switch (this.number) {
                  case 1:
                      return "🂷";
                  case 2:
                      return "🂻";
                  case 3:
                      return "🂽";
                  case 4:
                      return "🂾";
                  case 5:
                      return "🂺";
                  case 6:
                      return "🂱";
              }
              break;
          case 4:
              switch (this.number) {
                  case 1:
                      return "🃇";
                  case 2:
                      return "🃋";
                  case 3:
                      return "🃍";
                  case 4:
                      return "🃎";
                  case 5:
                      return "🃊";
                  case 6:
                      return "🃁";
              }
              break;
      }
  }
}
const FARBE = {
  EICHEL: 1,
  SCHIPP: 2,
  HERZ: 3,
  SCHELLEN: 4
};
const WERT = {
  SIEBEN: 1,
  UNTER: 2,
  OBER: 3,
  KOENIG: 4,
  ZEHN: 5,
  ASS: 6
};
