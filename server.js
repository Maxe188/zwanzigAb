// future impruvements: not using id, creating rooms, beautify css (use rem)

const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const { Card, createDeck, FARBE, WERT } = require('./classes/Card.js');
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
const maxPlayers = 6;
const nameSuggestions = ['Mattis', 'Peter', 'Thomas', 'Diter', 'Alex', 'Tine', 'Ute', 'Chistine', 'Hildegard', 'Kirsti', 'Nina', 'Mareike', 'Dennis', 'Gustav', 'Luka', 'Sara', 'Eberhard', 'Gerold', 'Gerlinde', 'Bregitte'];

//Game
var game = new Game([], [], [], [], null);

io.on('connection', (socket) => {
  //console.log(socket);
  console.log('O a user ' + socket.id + ' connected');
  players[socket.id] = { savedSocket: socket };

  const playerCount = Object.keys(players).length;
  if (playerCount > maxPlayers) console.log('too many players!!!!!!!');

  // Returns a random integer from 0 to 9:
  let randomIndex = Math.floor(Math.random() * nameSuggestions.length);
  //name suggestion
  socket.emit('name suggestion', nameSuggestions[randomIndex]);

  socket.on('set name', (recivedName) => {
    players[socket.id].name = recivedName;
    updatePlayers();
    console.log('user ' + socket.id + ' set name to: ' + recivedName);

    console.log('all players: {');
    for (const id in players) {
      const player = players[id];
      console.log(' ' + player.name);
    }
    console.log('}');
  });
  socket.on('starting game', () => {
    startGame(false);
  });
  socket.on('starting debug game', () => {
    startGame(true);
  });
  function startGame(startAsDebug) {
    // future: check players >= 2    do not if debug
    game = new Game([], createDeck(), [], [], new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT));
    // future: adding players to game obj   move to GameCore!!
    let i = 0;
    for (const id in playersWithNames()) {
      const player = playersWithNames()[id];
      game.players[i] = new Player(id, player.name);
      i++;
    }

    // send clients a start game event
    startAsDebug ? io.emit('start debug game') : io.emit('start game');
    startAsDebug ? game.Start(true) : game.Start();
    console.log('game started');

    updateLeaderboard();

    // update clients to show new empty game and sand first action: deal three
    updateGameStates();
    console.log('send deal three to the current player');
    getSocket(game.dealingPlayer.id).emit('deal three');
  }
  socket.on('start dealing three', () => {
    if (!(socket.id === game.dealingPlayer.id)) return;
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing three request');
    game.dealThree();
    updateGameStates();

    console.log('send choose trumpf to next player');
    getSocket(game.trumpfPlayer.id).emit('choose trumpf');
  });
  socket.on('set trumpf', (cardIndex) => {
    if (!(socket.id === game.trumpfPlayer.id)) return;
    let trumpfColor = game.trumpfPlayer.hand[cardIndex].color;
    console.log('current player (' + game.trumpfPlayer.name + ') set trumpf to: ' + Object.keys(FARBE)[trumpfColor - 1]);
    game.setTrumpf(trumpfColor);
    io.emit('update trumpf', game.currentRound.trumpf);

    console.log('send deal two to the current player');
    getSocket(game.dealingPlayer.id).emit('deal two');
  });
  socket.on('start dealing two', () => {
    game.dealTwo();
    updateGameStates();
    io.emit('trade');
  });
  socket.on('enterTrade', (indices) => {
    let tradingPlayer = game.players.find((player) => player.id === socket.id);
    tradingPlayer.trade(indices, game.deck, game.used);
    updateOnePlayer(tradingPlayer);
    if (game.players.every((player) => player.traded == true)) console.log('yaaaaay!!!!!');
  });
  socket.on('not participating', () => {
    let tradingPlayer = game.players.find((player) => player.id === socket.id);
    tradingPlayer.doNotParticipate(game.used);
    updateOnePlayer(tradingPlayer);
    updateLeaderboard();
    if (game.players.every((player) => player.traded == true)) console.log('yaaaaay!!!!!');
  });
  ///...


  socket.on('get Card', () => {
    const card = new Card(WERT.ASS, FARBE.HERZ);
    console.log(players[socket.id].name + ' recived Card: ' + card.toString())
    socket.emit('recive Card', card);
  });

  socket.on('disconnect', (reason) => {
    delete players[socket.id];
    updatePlayers();
    console.log('X a user ' + socket.id + ' disconnected because of: ' + reason);
    if (game.running) {
      game.Stop();
      game = new Game([], [], [], [], null);
      io.emit('game ended');
    }
  });

  function updateGameStates() {
    console.log('Deck length: ' + game.deck.length);
    console.log('number of used cards: ' + game.used.length);
    //console.log('Deck: ' + game.deck.toString());
    game.players.forEach(player => {
      console.log(player.toString() + ' stiche: ' + player.stiche);
    });

    for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
      let gameState = {};
      gameState.ownHand = game.players[playerIndex].hand;
      gameState.center = game.center;
      let tempOtherPlayers = {};
      for (let otherPlayer = 0; otherPlayer < game.players.length; otherPlayer++) {
        if (otherPlayer == playerIndex) continue;
        tempOtherPlayers[game.players[otherPlayer].name] = {
          handCount: game.players[otherPlayer].hand.length,
          stichCount: game.players[otherPlayer].stiche
        }
      }
      gameState.otherPlayers = tempOtherPlayers;
      getSocket(game.players[playerIndex].id).emit('update gameState', gameState);
    }
    // socket.emit their game state !!
    /*
    {
      eigene hand
      mitte
      andereSpieler {
        player 1  { anzahl hand    anzahl stiche }
        player 2   ...
      }
    }
    */
  }
  function updateOnePlayer(player) {
    console.log('Deck length: ' + game.deck.length);
    console.log('number of used cards: ' + game.used.length);
    console.log(player.toString() + ' stiche: ' + player.stiche);

    let gameState = {};
    gameState.ownHand = player.hand;
    gameState.center = game.center;
    let tempOtherPlayers = {};
    for (let otherPlayer = 0; otherPlayer < game.players.length; otherPlayer++) {
      if (game.players[otherPlayer] == player) continue;
      tempOtherPlayers[game.players[otherPlayer].name] = {
        handCount: game.players[otherPlayer].hand.length,
        stichCount: game.players[otherPlayer].stiche
      }
    }
    gameState.otherPlayers = tempOtherPlayers;
    getSocket(player.id).emit('update gameState', gameState);
  }

  // log leaderboard and send update event to all
  function updateLeaderboard(){
    console.log('update leaderbord to: ' + game.leaderboard);
    io.emit('update leaderboard', game.leaderboard);
  }

  function getSocket(recivingId) {
    return players[recivingId].savedSocket;
  }

  function updatePlayers() {
    io.emit('update players', playersWithNames());
  }

  function playersWithNames() {
    let tempPlayers = {};
    for (const id in players) {
      const player = players[id];
      if (player.hasOwnProperty('name')) tempPlayers[id] = { name: player.name };
    }
    return tempPlayers;
  }

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