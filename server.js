const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const {Card, createDeck, FARBE, WERT} = require('./classes/Card.js');
const Game = require('./classes/GameCore.js');
const Player = require('./classes/Player.js');
const Round = require('./classes/Round.js');

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// make the public folder public for files to refrerence eachother
app.use(express.static('public'));

// handle get request
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const players = {};

//Game
var game = new Game([],createDeck(),[],[],new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT));

io.on('connection', (socket) => {
  console.log('a user ' + socket.id + ' connected');
  players[socket.id] = {};

  socket.on('set name', (recivedName) => {
    players[socket.id] = { name: recivedName };
    io.emit('update players', players);
    console.log('user ' + socket.id + ' set name to: ' + recivedName);
    console.log(players);
  });
  socket.on('starting game', () => {
    io.emit('start game');
    console.log('game started');
    game.Start();
    let i = 0;
    for(const id in players){
      const player = players[id];
      game.players[i] = new Player(id, player.name);
      i++;
    }
    console.log(game.leaderboard);
    io.emit('update leaderboard', game.leaderboard);
    // send austeilenDrei to player[0]
  });
  // on ausgeteilt; give each player 3 cards; send trumpf bestimmen to player 1
  // on trumpf bestimmt; send austeilenZwei to player 0
  ///...
  socket.on('get Card', () => {
    const card = new Card(WERT.ASS, FARBE.HERZ);
    console.log(players[socket.id].name + 'recived Card: ' + card.toString())
    socket.emit('recive Card', card);
  });

  socket.on('disconnect', (reason) => {
    delete players[socket.id];
    io.emit('update players', players);
    console.log('user disconnected because of: ' + reason);
    if(!(game.running)){
      // end game
    }
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