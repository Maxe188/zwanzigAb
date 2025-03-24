// import libraries
const express = require('express');
const { createServer, get } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const crypto = require("crypto"); // future: maybe uuid
const randomId = () => crypto.randomBytes(8).toString("hex");
const randomRoomId = () => crypto.randomBytes(3).toString("hex");

// import local files
const { Card, createDeck, FARBE, WERT } = require('./classes/Card.js');
const { Game, STATES } = require('./classes/GameCore.js');
const Player = require('./classes/Player.js');
const Round = require('./classes/Round.js');
const Room = require('./classes/Room.js');

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

const sessions = {}; // sessionID: {userID, timeOfLastConnection, connected}
const expirationTimeInSec = 900 * 1000; // 900sec. = 15min.
// loop to check expired sessions
const intervalSession = setInterval(expirationCheck, 1000); //every second
// clearInterval(intervalSession);
function expirationCheck() {
  const rightNow = Date.now();
  for (const sessionID in sessions) {
    const session = sessions[sessionID];
    if (rightNow - session.timeOfLastConnection > expirationTimeInSec) {
      console.log('kicked: ' + sessionID + ' user: ' + session.userID + ' because of inactivity');
      if (session.userID) {
        getSocket(session.userID).emit('kicked', 'Inaktivität');
        rooms[users[session.userID].roomID].removePlayer(users[session.userID].savedSocket);
        if (rooms[users[session.userID]].game.isRunning) io.emit('game ended');
        delete users[session.userID];
      }
      delete sessions[sessionID];
    }
  }
}

// globals
const rooms = {};
const users = {}; // userID: {name, roomID, savedSocket}
const nameSuggestions = ['Mattis', 'Peter', 'Thomas', 'Diter', 'Alex', 'Tine', 'Ute', 'Chistine', 'Hildegard', 'Kirsti', 'Nina', 'Mareike', 'Dennis', 'Gustav', 'Luka', 'Sara', 'Eberhard', 'Gerold', 'Gerlinde', 'Bregitte'];


// user authentification: sessionID(private, reconnection, validation), userID(public, for others)
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID && sessionID !== 'undefined') {
    // find existing session
    const session = sessions[sessionID];
    if (session) {
      socket.sessionID = sessionID;
      if(session.userID) socket.userID = session.userID;
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

  // create new session
  if(!sessions[socket.sessionID]) { 
    sessions[socket.sessionID] = {
      timeOfLastConnection: Date.now(),
      connected: true
    };
  }

  // send IDs
  socket.emit("session", {
    sessionID: socket.sessionID
  });

  // find game on reconnection
  for (const roomID in rooms) {
    const room = rooms[roomID];
    const reconnectingPlayer = room.game.players.find(player => player.id === socket.userID);
    if (reconnectingPlayer) {
      socket.join(roomID);
      users[socket.userID] = {
        name: reconnectingPlayer.name,
        roomID: roomID,
        savedSocket: socket
      }
      updatePlayersForOnePlayer(reconnectingPlayer);
      if(room.game.isRunning) {
        updateOnePlayer(reconnectingPlayer);
        sendLeaderboardToOne(reconnectingPlayer);
      }
      break;
    }
  }

  if (!users[socket.userID]) {
    // Returns a random integer from 0 to 9:
    let randomIndex = Math.floor(Math.random() * nameSuggestions.length);
    //name suggestion
    socket.emit('name suggestion', nameSuggestions[randomIndex]);
  }

  socket.on('join room', ({ recivedName, roomInfo }) => { // roomInfo: any for any room, id for specific, create for new
    if(!recivedName || Object.values(users).find(user => user.name === recivedName) != undefined) {
      socket.emit('joined room response', 'nameTaken');
      return;
    }
    
    let roomID;
    if(roomInfo === 'create') {
      roomID = randomRoomId();
      rooms[roomID] = new Room(roomID);
    } else if(roomInfo === 'any') {
      let possibleRoomID;
      for (const testRoomID in rooms) {
        const room = rooms[testRoomID];
        if (room.game.isRunning || room.isFull) continue;
        possibleRoomID = testRoomID;
        break;
      }
      if (possibleRoomID) {
        roomID = possibleRoomID;
      } else {
        roomID = randomRoomId();
        rooms[roomID] = new Room(roomID);
      }
    } else {
      if(!rooms[roomInfo]) {
        socket.emit('joined room response', 'roomNotFound');
        return;
      } else if(rooms[roomInfo].isFull) {
        socket.emit('joined room response', 'roomFull');
        return;
      }
      roomID = roomInfo;
    }

    socket.userID = randomId();
    users[socket.userID] = {
      name: recivedName,
      roomID: roomID, 
      savedSocket: socket
    };

    const addingResponse = rooms[roomID].addPlayer(socket, recivedName);
    if(addingResponse === 'room full') {
      socket.emit('joined room response', addingResponse);
      return;
    }
    socket.emit('joined room response', roomID);

    //socket.emit('game already running');

    sessions[socket.sessionID].userID = socket.userID;
    
    updatePlayers();
    console.log('user ' + socket.userID + ' joined room: ' + roomID + ' and set name to: ' + recivedName);
    

    console.log('all users: {');
    for (const id in users) {
      const user = users[id];
      console.log('  ' + id + ' : ' + user.name);
    }
    console.log('}');
  });
  socket.on('starting game', () => {
    const game = getGame();
    if (game.isRunning) { error('game already running'); return; }
    if (game.players.length < 2) return;
    startGame(false, game);
  });
  socket.on('starting debug game', () => {
    startGame(true, getGame());
  });
  function startGame(startAsDebug, game) {
    // future: check players >= 2    do not if debug
    game.deck = createDeck();
    // future: adding players to game obj   move to GameCore!!

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
    const game = getGame();
    if (!game.isRunning) { error('game not running (deal three)'); return; }
    if (!(socket.userID === game.dealingPlayer.id)) { error('not dealing-player tried to deal three'); return; }
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing three request');
    game.dealThree();
    updateGameStates();

    console.log('send choose trumpf to next player');
    getSocket(game.trumpfPlayer.id).emit('choose trumpf');
  });
  socket.on('set trumpf', (cardIndex) => {
    const game = getGame();
    if (!game.isRunning) { error('game not running (set trumpf)'); return; }
    if (!(socket.userID === game.trumpfPlayer.id)) { error('not trumpf-player tried to set trumpf'); return; }
    let trumpfColor = game.trumpfPlayer.hand[cardIndex].color;
    console.log('current player (' + game.trumpfPlayer.name + ') set trumpf to: ' + Object.keys(FARBE)[trumpfColor - 1]);
    game.setTrumpf(trumpfColor);
    toPlayingPlayers('update trumpf', game.currentRound.trumpf);

    console.log('send deal two to the current player');
    getSocket(game.dealingPlayer.id).emit('deal two');
  });
  socket.on('start dealing two', () => {
    const game = getGame();
    if (!game.isRunning) { error('game not running (deal two)'); return; }
    if (!(socket.userID === game.dealingPlayer.id))  { error('not dealing-player tried to deal two'); return; }
    console.log('current player (' + game.dealingPlayer.name + ') answered dealing two request');
    game.dealTwo();
    updateGameStates();

    toPlayingPlayers('trade');
  });
  socket.on('enterTrade', (indices) => {
    const game = getGame();
    if (!game.isRunning) { error('game not running (enterd trade)'); return; }
    let tradingPlayer = game.players.find((player) => player.id === socket.userID);
    game.playerTrades(tradingPlayer, indices);

    updateGameStates();
    if (game.players.every((player) => player.traded == true)) {
      console.log('lets gooo!!!!!');
      game.state = STATES.PLAY;
      toPlayingPlayers('lets go');
    }
  });
  socket.on('not participating', () => {
    const game = getGame();
    if (!game.isRunning) { error('game not running (not participating)'); return; }
    let tradingPlayer = game.players.find((player) => player.id === socket.userID);
    if (!(game.playerDoNotParticipate(tradingPlayer))) { error('not participating not worked'); return; }

    updateGameStates();
    sendLeaderboard();
    if (game.players.every((player) => player.traded == true)) {
      console.log('lets gooo!!!!!');
      game.state = STATES.PLAY;
      toPlayingPlayers('lets go');
    }
  });
  socket.on('play card', (cardIndex) => {
    const game = getGame();
    if (!game.isRunning) { error('game not running (play card)'); return; }
    if (!(socket.userID === game.currentPlayer.id))  { error('not currentPlayer tried to play card'); return; }
    let playingPlayer = game.players.find((player) => player.id === socket.userID);
    console.log('player (' + playingPlayer + ') clicked card: ' + playingPlayer.hand[cardIndex].toString());

    let playingResponse = game.checkAndPlayCard(playingPlayer, cardIndex);
    switch (playingResponse) {
      case 'played':
        updateGameStates();
        setTimeout(() => {
          game.triggerLastTurn(); // needed??
          updateGameStates();
          toPlayingPlayers('update trumpf', game.currentRound.trumpf);
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
              player.score <= 0 ? getSocket(player.id).emit('won') : getSocket(player.id).emit('lost');
            });
            //toPlayingPlayers('game ended');
            for(const player of game.players) {
              delete users[player.id];
            }
            game.Stop();
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


  socket.on('leave game', () => {
    const roomID = getRoomID();
    const game = getGame();
    if(!game.isRunning) { error('game not running (leave game)'); return; }

    for(const player of game.players) {
      delete users[player.id];
    }
    game.Stop();

    io.to(roomID).emit('game ended');
  });

  socket.on('disconnect', (reason) => {
    if(socket.userID) {
      const game = getGame();
      delete users[socket.userID];
      updatePlayers();
    }
    sessions[socket.sessionID].connected = false;
    console.log('X a session ' + socket.sessionID + ' disconnected because of: ' + reason);
    if (false && Object.entries(game.players).findIndex(player => player.id === socket.userID) > -1 && game.isRunning) { // future: stop when session ended ::: rework compleatly
      game.Stop();
      toPlayingPlayers('game ended');
    }
    socket.sessionID = null;
    socket.userID = null;
  });

  socket.onAny((eventName, ...args) => {
    if(eventName === 'join room' || sessions[socket.sessionID].userID) {
      // refresh session
      sessions[socket.sessionID].timeOfLastConnection = Date.now();
      sessions[socket.sessionID].timeOfLastConnection.connected = true;
    } else {
      socket.emit('not connected');
      socket.disconnect();
    }
  });

  // local helper functions because they need access to socket
  function updateGameStates() {
    const game = getGame();
    console.log('*** game state ***');
    console.log('Deck length: ' + game.deck.length);
    console.log('number of used cards: ' + game.used.length);
    //console.log('Deck: ' + game.deck.toString());
    game.players.forEach(player => {
      console.log(player.toString() + ' stiche: ' + player.stiche);
    });

    for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
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
    const game = getGame();
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

  function toPlayingPlayers(eventMessage, optionalData) {
    const game = getGame();
    // can be replaced if players are in a room
    if (optionalData) {
      game.players.forEach(player => getSocket(player.id).emit(eventMessage, optionalData));
    } else {
      game.players.forEach(player => getSocket(player.id).emit(eventMessage));
    }
  }

  // log leaderboard and send update event to all
  function sendLeaderboard() {
    const game = getGame();
    game.updateLeaderboard();
    console.log(game.leaderboard);
    toPlayingPlayers('update leaderboard', game.leaderboard);
  }
  function sendLeaderboardToOne(player) {
    const game = getGame();
    getSocket(player.id).emit('update leaderboard', game.leaderboard);
  }

  function updatePlayers() {
    //console.log('update players');
    if (getRoomID() === undefined) return;
    if (getGame() === undefined) return;
    io.to(getRoomID()).emit('update players', getPlayerNameAndID());
  }
  function updatePlayersForOnePlayer(player) {
    getSocket(player.id).emit('update players', getPlayerNameAndID());
  }

  function getPlayerNameAndID() {
    const game = getGame();
    let tempPlayers = {};
    for (const player of game.players) {
      tempPlayers[player.id] = { name: player.name };
    }
    //console.log('players: ' + JSON.stringify(tempPlayers));
    return tempPlayers;
  }

  function getGame() {
    const userID = sessions[socket.sessionID].userID;
    if(!userID) { error('userID in sessions not found (get game)'); return; }
    if(!users[userID]) { error('user not found (get game)'); return; }
    if(!users[userID].roomID) { error('roomID in user not found (get game)'); return; }
    if(!rooms[users[userID].roomID]) { error('room not found (get game)'); return; }
    return rooms[users[userID].roomID].game;
  }
  function getRoomID() {
    const userID = sessions[socket.sessionID].userID;
    if(!userID) { error('userID in sessions not found (get room)'); return; }
    if(!users[userID]) { error('user not found (get room)'); return; }
    if(!users[userID].roomID) { error('roomID in user not found (get room)'); return; }
    return users[userID].roomID;
  }

  /* future chat feature
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
  */
});

// helper functions
function error(message) {
  console.log('ERROR: ' + message);
  io.emit('error', message);
}

function getSocket(recivingId) {
  return users[recivingId].savedSocket;
}


// Dashboard
app.get('/dash', (req, res) => {
  const rightNow = Date.now();
  let dashboardHTML = '';
  dashboardHTML += '<title>Dashboard</title>';
  dashboardHTML += '<p>online users (clientsCount): ' + io.engine.clientsCount + ' online users (sockets.size): ' + io.of("/").sockets.size + '<p>';
  dashboardHTML += '<p>currently running games: ' + Object.keys(rooms).length + '<p>';
  dashboardHTML += '<p>sessions: {<br>';
  for (const sessionID in sessions) {
    const session = sessions[sessionID];
    const elapsed = new Date(rightNow - session.timeOfLastConnection);
    dashboardHTML += '&nbsp;&nbsp;' + sessionID + ' { ' + session.userID + ' : ' + elapsed.getMinutes() + ':' + elapsed.getSeconds() + ' }<br>';
  }
  dashboardHTML += '}<p>';
  dashboardHTML += '<p>users: {<br/>';
  for (const userID in users) {
    const user = users[userID];
    dashboardHTML += '&nbsp;&nbsp;' + userID + ' : ' + user.name + ' : ' + user.roomID + '<br/>';
  }
  dashboardHTML += '}<p>';
  dashboardHTML += '<p>players of first room: {<br/>';
  if(Object.keys(rooms).length === 0) {
    dashboardHTML += '&nbsp;&nbsp;no rooms created yet <br/>';
  } else {
    for (const player of rooms[Object.keys(rooms)[0]].game.players) {
      dashboardHTML += '&nbsp;&nbsp;' + player.id + ' : ' + player.name + '<br/>';
    }
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