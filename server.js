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
      console.log('  ' + id + ' : ' + player.name);
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
    game = new Game([], createDeck(), [], [], null);
    // future: adding players to game obj   move to GameCore!!
    let i = 0;
    const playersWithNames = getPlayersWithNames();
    for (const id in playersWithNames) {
      const player = playersWithNames[id];
      game.players[i] = new Player(id, player.name);
      i++;
    }

    // send clients a start game event
    startAsDebug ? toPlayingPlayers('start debug game') : toPlayingPlayers('start game');
    startAsDebug ? game.Start(true) : game.Start();
    console.log('game started');

    sendLeaderboard();

    // update clients to show new empty game and sand first action: deal three
    updateGameStates();

    console.log('send deal three to the current player');
    getSocket(game.dealingPlayer.id).emit('deal three');
  }
  socket.on('start dealing three', () => {
    if(!game.isRunning) return;
    if (!(socket.id === game.dealingPlayer.id)) return;
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing three request');
    game.dealThree();
    updateGameStates();

    console.log('send choose trumpf to next player');
    getSocket(game.trumpfPlayer.id).emit('choose trumpf');
  });
  socket.on('set trumpf', (cardIndex) => {
    if(!game.isRunning) return;
    if (!(socket.id === game.trumpfPlayer.id)) return;
    let trumpfColor = game.trumpfPlayer.hand[cardIndex].color;
    console.log('current player (' + game.trumpfPlayer.name + ') set trumpf to: ' + Object.keys(FARBE)[trumpfColor - 1]);
    game.setTrumpf(trumpfColor);
    toPlayingPlayers('update trumpf', game.currentRound.trumpf);

    console.log('send deal two to the current player');
    getSocket(game.dealingPlayer.id).emit('deal two');
  });
  socket.on('start dealing two', () => {
    if(!game.isRunning) return;
    if (!(socket.id === game.dealingPlayer.id)) return;
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing two request');
    game.dealTwo();
    updateGameStates();

    toPlayingPlayers('trade');
  });
  socket.on('enterTrade', (indices) => {
    if(!game.isRunning) return;
    let tradingPlayerIndex = game.players.findIndex((player) => player.id === socket.id);
    game.playerTrades(tradingPlayerIndex, indices);

    updateGameStates();
    if (game.players.every((player) => player.traded == true)) {
      console.log('lets gooo!!!!!');
      toPlayingPlayers('lets go');
    }
  });
  socket.on('not participating', () => {
    if(!game.isRunning) return;
    let tradingPlayer = game.players.find((player) => player.id === socket.id);
    if(tradingPlayer === game.trumpfPlayer) return; // !!!
    tradingPlayer.doNotParticipate(game.used);

    updateGameStates();
    sendLeaderboard();
    if (game.players.every((player) => player.traded == true)) {
      console.log('lets gooo!!!!!');
      toPlayingPlayers('lets go');
    }
  });
  socket.on('play card', (cardIndex) => {
    if(!game.isRunning) return;
    if (!(socket.id === game.currentPlayer.id)) return;
    let playingPlayer = game.players.find((player) => player.id === socket.id);
    console.log('player (' + playingPlayer + ') clicked card: ' + playingPlayer.hand[cardIndex].toString());

    let playingResponse = game.checkAndPlayCard(playingPlayer, cardIndex);
    switch(playingResponse) {
      case 'played':
        updateGameStates();
        setTimeout(() => {
          game.triggerLastTurn();
          updateGameStates();
        }, 1500);
        break;
      case 'not your turn':
        // send message to socket  never reached because check above
        break;
      case 'not valid card':
        socket.emit('not valid card', cardIndex);
        break;
      case 'new round':
        updateGameStates();
        setTimeout(() => {
          game.triggerLastTurn();
          sendLeaderboard();
          updateGameStates();
          if(game.didSomeoneWin){
            game.players.forEach(player => {
              player.score <= 0 ? getSocket(player.id).emit('won') : getSocket(player.id).emit('lost');
            });
          } else {
            console.log('send deal three to the current player');
            getSocket(game.dealingPlayer.id).emit('deal three');
          }
        }, 1500);
        break;
      case 'too soon':
        console.log('player clicked too soon');
        break;
      default:
        console.log('error');
    }
  });
  ///...



  socket.on('disconnect', (reason) => {
    delete players[socket.id];
    updatePlayers();
    console.log('X a user ' + socket.id + ' disconnected because of: ' + reason);
    if (game.isRunning) {
      game.Stop();
      game = new Game([], [], [], [], null);
      toPlayingPlayers('game ended');
    }
  });

  function updateGameStates() {
    console.log('*** game state ***');
    console.log('Deck length: ' + game.deck.length);
    console.log('number of used cards: ' + game.used.length);
    //console.log('Deck: ' + game.deck.toString());
    game.players.forEach(player => {
      console.log(player.toString() + ' stiche: ' + player.stiche);
    });

    for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
      let gameState = {};
      gameState.ownHand = game.players[playerIndex].hand;
      gameState.ownStiche = game.players[playerIndex].stiche;
      gameState.center = game.center;
      gameState.currentPlayerName = game.currentPlayer.name;
      let tempOtherPlayers = {};
      for (let otherPlayer = 0; otherPlayer < game.players.length; otherPlayer++) {
        if (otherPlayer === playerIndex) {
          tempOtherPlayers[game.players[otherPlayer].name] = 'you';
          continue;
        }
        tempOtherPlayers[game.players[otherPlayer].name] = {
          handCount: game.players[otherPlayer].hand.length,
          stichCount: game.players[otherPlayer].stiche
        }
      }
      gameState.otherPlayers = tempOtherPlayers;
      getSocket(game.players[playerIndex].id).emit('update gameState', gameState);
    }
    console.log('*** game state end ***');
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
    console.log('*** game state ***');
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
    console.log('*** game state end ***');
  }

  function toPlayingPlayers(eventMessage, optionalData){
    // can be replaced if players are in a room
    if(optionalData){
      game.players.forEach(player => getSocket(player.id).emit(eventMessage, optionalData));
    } else {
      game.players.forEach(player => getSocket(player.id).emit(eventMessage));
    }
  }

  // log leaderboard and send update event to all
  function sendLeaderboard(){
    game.updateLeaderboard();
    console.log(game.leaderboard);
    toPlayingPlayers('update leaderboard', game.leaderboard);
  }

  function getSocket(recivingId) {
    return players[recivingId].savedSocket;
  }

  function updatePlayers() {
    io.emit('update players', getPlayersWithNames());
  }

  function getPlayersWithNames() {
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