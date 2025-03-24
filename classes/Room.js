const { Game } = require('./GameCore.js');
const Player = require('./Player.js');

class Room {
    //roomName = '';
    game = null;
    maxPlayers = 5;
    isFull = false;

    constructor(id) {
        this.id = id;
        this.game = new Game([], [], [], [], null);
    }

    addPlayer(socket, name) {
        if(this.isFull) return 'room full';
        socket.join(this.id);
        
        this.game.players.push(new Player(socket.userID, name));

        if(this.game.players.length >= this.maxPlayers) this.isFull = true;
    }
    removePlayer(socket) {
        socket.leave(this.id);
    }

    closeRoom() {
        throw new Error('Not implemented');
    }
}

module.exports = Room;