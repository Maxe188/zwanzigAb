const { Game, STATES } = require('./classes/GameCore.js');
const randomId = () => crypto.randomBytes(8).toString("hex");

class Room {
    //name = '';
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
        
        game.players.push(new Player(socket.userID, name));

        if(this.game.players.length >= this.maxPlayers) this.isFull = true;
    }
    removePlayer(socket) {
        socket.leave(this.id);
    }
}

module.exports = Room;