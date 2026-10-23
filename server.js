// import libraries
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const crypto = require("crypto"); // future: maybe uuid
const randomId = () => crypto.randomBytes(8).toString("hex");

// import local files
const { Card, createDeck, FARBE, WERT } = require('./classes/Card.js');
const { Game, STATES } = require('./classes/GameCore.js');
const Player = require('./classes/Player.js');

// create server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});
// set port to predifined environment var or 3000
const port = process.env.PORT || 3000;

// make the public-folder public for files to refrerence eachother
app.use(express.static('public'));

// handle get request
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const sessions = {};
const expirationTimeInSec = 900 * 1000; // 15min.
// loop to check expired sessions
const intervalSession = setInterval(expirationCheck, 1000); //every second
// clearInterval(intervalSession);
function expirationCheck() {
  const rightNow = Date.now();
  for (const sessionID in sessions) {
    const session = sessions[sessionID];
    if (rightNow - session.timeOfLastConnection > expirationTimeInSec) {
      console.log('kicked: ' + sessionID + ' user: ' + session.userID + ' because of inactivity');
      delete sessions[sessionID];
      if (session.userID) {
        getSocket(session.userID).emit('kicked', 'Inaktivität');
        delete users[session.userID];
      }
      if (game.isRunning) io.emit('game ended');
    }
  }
}

// globals
const users = {};
const maxPlayers = 6;
const nameSuggestions = ['Mattis', 'Peter', 'Thomas', 'Diter', 'Alex', 'Tine', 'Ute', 'Chistine', 'Hildegard', 'Kirsti', 'Nina', 'Mareike', 'Dennis', 'Gustav', 'Luka', 'Sara', 'Eberhard', 'Gerold', 'Gerlinde', 'Bregitte'];
var tempUsers = {};

var game = new Game([], [], [], [], null);

// user authentification: sessionID(private, reconnection, validation), userID(public, for others)
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // find existing session
    const session = sessions[sessionID];
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      session.timeOfLastConnection = Date.now();

      console.log('user ' + sessionID + ' reconnected');

      return next();
    }
  }
  // create new IDs
  socket.sessionID = randomId();
  next();
});

io.on('connection', (socket) => {
  console.log('O a session ' + socket.sessionID + ' connected');

  sessions[socket.sessionID] = {
    timeOfLastConnection: Date.now(),
    connected: true,
  };
  // send IDs
  socket.emit("session", {
    sessionID: socket.sessionID
  });

  const playerCount = Object.keys(users).length; // future: rework
  if (playerCount > maxPlayers) console.log('too many players!!!!!!!');

  if (game.isRunning) {
    const reconnectingPlayer = game.players.find((player) => player.id === socket.userID);
    if (!reconnectingPlayer) {
      //socket.emit('game already running');
      return; // add specktatormode
    }
    users[socket.userID].name = reconnectingPlayer.name;
    updatePlayersForOnePlayer(reconnectingPlayer);
    updateOnePlayer(reconnectingPlayer);
    sendLeaderboardToOne(reconnectingPlayer);
  } else {
    // Returns a random integer for name list:
    let randomIndex = Math.floor(Math.random() * nameSuggestions.length);
    //name suggestion
    socket.emit('name suggestion', nameSuggestions[randomIndex]);
  }

  socket.on('set name', (recivedName) => {
    if (game.isRunning) {
      //socket.emit('game already running');
      return;
    }
    socket.userID = randomId();

    users[socket.userID] = {
      name: recivedName,
      savedSocket: socket
    };
    updatePlayers();
    console.log('user ' + socket.userID + ' joined and set name to: ' + recivedName);
    
    sessions[socket.sessionID].userID = socket.userID;

    console.log('all players: {');
    for (const id in users) {
      const user = users[id];
      console.log('  ' + id + ' : ' + user.name);
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
    const usersWithNames = getUsersWithNames();
    for (const id in usersWithNames) {
      const user = usersWithNames[id];
      game.players.push(new Player(id, user.name, user.isBot));
    }

    // send clients a start game event
    startAsDebug ? toPlayingPlayers('start debug game') : toPlayingPlayers('start game');
    startAsDebug ? game.Start(true) : game.Start(false);
    console.log('game started');

    sendLeaderboard();

    // update clients to show new empty game and sand first action: deal three
    updateGameStates();

    startPlaying();
  }
  function startPlaying() {
    if(game.dealingPlayer.isBot) {
      console.log(game.dealingPlayer.name + ' is dealing three');
      startDealingThree();
    } else {
      console.log('send deal three to the current player');
      getSocket(game.dealingPlayer.id).emit('deal three');
    }
  }
  socket.on('add bot', () => {
    if (game.isRunning) return;
    const botName = 'bot' + Math.floor(Math.random() * 1000);
    const botID = randomId();
    users[botID] = {
      name: botName,
      savedSocket: null,
      isBot: true
    };
    updatePlayers();
    console.log('bot added: ' + botName);
  });
  socket.on('remove bot', () => {
    if (game.isRunning) return;
    const botIndex = game.players.findLastIndex(player => player.isBot);
    if (botIndex > -1) {
      const bot = game.players[botIndex];
      game.players.splice(botIndex, 1);
      delete users[bot.id];
      updatePlayers();
      console.log('bot removed: ' + bot.name);
    }
  });

  socket.on('start dealing three', () => {
    if (!game.isRunning) return;
    if (!(socket.userID === game.dealingPlayer.id)) return;
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing three request');
    startDealingThree();
  });
  function startDealingThree() {
    game.dealThree();
    updateGameStates();

    if(game.trumpfPlayer.isBot) {
      console.log(game.trumpfPlayer.name + ' is choosing trumpf');
      setTrumpf(game.botEngine.chooseTrumpf(game.trumpfPlayer.hand));
    } else {
      console.log('send choose trumpf to next player');
      getSocket(game.trumpfPlayer.id).emit('choose trumpf');
    }
  }
  socket.on('set trumpf', (cardIndex) => {
    if (!game.isRunning) return;
    if (!(socket.userID === game.trumpfPlayer.id)) return;
    let trumpfColor = game.trumpfPlayer.hand[cardIndex].color;
    setTrumpf(trumpfColor);
  });
  function setTrumpf(trumpfColor) {
    console.log('current player (' + game.trumpfPlayer.name + ') set trumpf to: ' + Object.keys(FARBE)[trumpfColor - 1]);
    game.setTrumpfColor(trumpfColor);
    toPlayingPlayers('update trumpf', game.currentRound.trumpf);

    if(game.dealingPlayer.isBot) {
      console.log(game.dealingPlayer.name + ' is dealing two');
      startDealingTwo();
    } else {
      console.log('send deal two to the current player');
      getSocket(game.dealingPlayer.id).emit('deal two');
    }
  }
  
  socket.on('start dealing two', () => {
    if (!game.isRunning) return;
    if (!(socket.userID === game.dealingPlayer.id)) return;
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing two request');
    startDealingTwo();
  });
  function startDealingTwo() {
    game.dealTwo();
    updateGameStates();

    // players
    toPlayingPlayers('trade');
    // bots
    game.players.filter(player => player.isBot).forEach(botPlayer => {
      enterTrade(botPlayer, game.botEngine.chooseCardsToTrade(botPlayer.hand, game.currentRound.trumpf));
    });
  }
  socket.on('enterTrade', (indices) => {
    if (!game.isRunning) return;
    let tradingPlayer = game.players.find((player) => player.id === socket.userID);
    if (!tradingPlayer) return;
    enterTrade(tradingPlayer, indices);
  });
  function enterTrade(player, indices) {
    game.playerTrades(player, indices);

    updateGameStates();
    checkIfAllPlayersTraded();
  }
  socket.on('not participating', () => {
    if (!game.isRunning) return;
    let tradingPlayer = game.players.find((player) => player.id === socket.userID);
    if (!(game.playerDoNotParticipate(tradingPlayer))) {
      console.log('not participating not worked');
      return;
    }

    updateGameStates();
    sendLeaderboard();

    checkIfAllPlayersTraded();
  });
  function checkIfAllPlayersTraded() {
    if (!(game.players.every((player) => player.traded == true))) return;
    console.log('lets gooo!!!!!');
    game.state = STATES.PLAY;
    toPlayingPlayers('lets go');

    if(!(game.currentPlayer.isBot)) return;
    botPlayCard();
  }
  function botPlayCard() {
    let cardToPlay = game.botEngine.chooseCard(game.center, game.currentPlayer.hand, game.currentRound);
    console.log(game.currentPlayer.name + ' is playing card: ' + game.currentPlayer.hand[cardToPlay].toString());
    playCard(game.currentPlayer, cardToPlay);
  }

  socket.on('play card', (cardIndex) => {
    if (!game.isRunning) return;
    if (!(socket.userID === game.currentPlayer.id)) return; // future: only check if player is in game.players
    let playingPlayer = game.players.find((player) => player.id === socket.userID);
    console.log('player (' + playingPlayer + ') clicked card: ' + playingPlayer.hand[cardIndex].toString());

    playCard(playingPlayer, cardIndex);
  });
  function playCard(player, cardIndex) {
    let playingResponse = game.checkAndPlayCard(player, cardIndex);
    switch (playingResponse) {
      case 'played':
        updateGameStates();
        setTimeout(() => {
          game.triggerLastTurn(); // needed??
          updateGameStates();
          toPlayingPlayers('update trumpf', game.currentRound.trumpf); // needed??

          if(game.currentPlayer.isBot && game.state == STATES.PLAY) {
            botPlayCard();
          }
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
          toPlayingPlayers('update trumpf', game.currentRound.trumpf);
          if (game.didSomeoneWin) {
            game.players.forEach(player => {
              if(!player.isBot) {
                player.score <= 0 ? getSocket(player.id).emit('won') : getSocket(player.id).emit('lost');
              }
            });
            //toPlayingPlayers('game ended');
            for(const player of game.players) {
              delete users[player.id];
            }
            game.Stop();
            console.log('game ended');
          } else {
            startPlaying();
          }
        }, 1500);
        break;
      case 'too soon':
        console.log('player clicked too soon');
        break;
      default:
        console.log('error');
    }
  }
  ///...


  socket.on('leave game', () => {
    if(!game.isRunning) return;
    io.emit('game ended');
  });

  socket.on('disconnect', (reason) => {
    delete users[socket.userID];
    updatePlayers();
    //sessions[socket.sessionID].connected = false;
    console.log('X a session ' + socket.sessionID + ' disconnected because of: ' + reason);
    if (false && Object.entries(game.players).findIndex(player => player.id === socket.userID) > -1 && game.isRunning) { // future: stop when session ended
      game.Stop();
      toPlayingPlayers('game ended');
    }
  });

  socket.onAny((eventName, ...args) => {
    //console.log("unknown event: " + eventName);
    sessions[socket.sessionID] = {
      timeOfLastConnection: Date.now(),
      connected: true,
    };
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
      if (game.players[playerIndex].isBot) continue;
      let gameState = {};
      gameState.yourName = game.players[playerIndex].name;
      gameState.ownHand = game.players[playerIndex].hand;
      gameState.ownStiche = game.players[playerIndex].stiche;
      gameState.center = game.center;
      gameState.currentPlayerName = game.currentPlayer.name;
      gameState.dealingPlayerName = game.dealingPlayer.name;
      gameState.state = game.state;
      gameState.youTraded = game.players[playerIndex].traded;
      gameState.debugGame = game.debugGame;
      gameState.trumpfColor = game.currentRound.trumpf;
      let tempOtherPlayers = {};
      for (let otherPlayer = 0; otherPlayer < game.players.length; otherPlayer++) {
        if (otherPlayer === playerIndex) {
          tempOtherPlayers[game.players[otherPlayer].name] = 'you';
          continue;
        }
        tempOtherPlayers[game.players[otherPlayer].name] = {
          handCount: game.players[otherPlayer].hand.length,
          stichCount: game.players[otherPlayer].stiche,
          traded: game.players[otherPlayer].traded
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
    gameState.yourName = player.name;
    gameState.ownHand = player.hand;
    gameState.center = game.center;
    gameState.currentPlayerName = game.currentPlayer.name;
    gameState.dealingPlayerName = game.dealingPlayer.name;
    gameState.state = game.state;
    gameState.youTraded = player.traded;
    gameState.debugGame = game.debugGame;
    gameState.trumpfColor = game.currentRound.trumpf;
    let tempOtherPlayers = {};
    for (let otherPlayer = 0; otherPlayer < game.players.length; otherPlayer++) {
      if (game.players[otherPlayer].id == player.id) {
        tempOtherPlayers[game.players[otherPlayer].name] = 'you';
        continue;
      }
      tempOtherPlayers[game.players[otherPlayer].name] = {
        handCount: game.players[otherPlayer].hand.length,
        stichCount: game.players[otherPlayer].stiche,
        traded: game.players[otherPlayer].traded
      }
    }
    gameState.otherPlayers = tempOtherPlayers;
    getSocket(player.id).emit('update gameState', gameState);
    console.log('*** game state end ***');
  }

  function toPlayingPlayers(eventMessage) {
    // can be reworked if players are in a room
    game.players.filter(p => !p.isBot).forEach(player => {
      getSocket(player.id).emit(eventMessage);
    });
  }
  function toPlayingPlayers(eventMessage, optionalData) {
    // can be reworked if players are in a room
    game.players.filter(p => !p.isBot).forEach(player => {
      getSocket(player.id).emit(eventMessage, optionalData);
    });
  }

  // log leaderboard and send update event to all
  function sendLeaderboard() {
    game.updateLeaderboard();
    console.log(game.leaderboard);
    toPlayingPlayers('update leaderboard', game.leaderboard);
  }
  function sendLeaderboardToOne(player) {
    getSocket(player.id).emit('update leaderboard', game.leaderboard);
  }

  function getSocket(recivingId) {
    return users[recivingId].savedSocket;
  }

  function updatePlayers() {
    io.emit('update players', getUsersWithNames());
  }
  function updatePlayersForOnePlayer(player) {
    getSocket(player.id).emit('update players', getUsersWithNames());
  }

  function getUsersWithNames() {
    if (game.isRunning) return tempUsers;
    tempUsers = {};
    for (const id in users) {
      const user = users[id];
      if (user.hasOwnProperty('name')) tempUsers[id] = { name: user.name, isBot: user.isBot ? true : false };
    }
    return tempUsers;
  }

  /* future chat feature
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  */
});


// Dashboard
app.get('/dash', (req, res) => {
  const rightNow = Date.now();
  let dashboardHTML = '';
  dashboardHTML += '<title>Dashboard</title>';
  dashboardHTML += '<p>online users (clientsCount): ' + io.engine.clientsCount + ' online users (sockets.size): ' + io.of("/").sockets.size + '<p>';
  dashboardHTML += '<p>sessions: {<br>';
  for (const sessionID in sessions) {
    const session = sessions[sessionID];
    const elapsed = new Date(rightNow - session.timeOfLastConnection);
    dashboardHTML += '&nbsp;&nbsp;' + sessionID + ' { ' + session.userID + ' : ' + elapsed.getMinutes() + ':' + elapsed.getSeconds() + ' }<br>';
  }
  dashboardHTML += '}<p>';
  dashboardHTML += '<p>users: {<br/>';
  for (const id in users) {
    const user = users[id];
    dashboardHTML += '&nbsp;&nbsp;' + id + ' : ' + user.name + '<br/>';
  }
  dashboardHTML += '}<p>';
  dashboardHTML += '<p>players: {<br/>';
  for (const id in game.players) {
    const player = game.players[id];
    dashboardHTML += '&nbsp;&nbsp;' + player.id + ' : ' + player.name + '<br/>';
  }
  dashboardHTML += '}<p>';
  res.send(dashboardHTML);
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