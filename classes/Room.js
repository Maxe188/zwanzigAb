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
        if(this.isFull) return 'roomFull';
        socket.join(this.id);
        
        this.game.players.push(new Player(socket.userID, name));

        if(this.game.players.length >= this.maxPlayers) this.isFull = true;
    }
    addBot(userID, name) {
        if(this.isFull) return 'roomFull';
        
        this.game.players.push(new Player(userID, name, true));

        if(this.game.players.length >= this.maxPlayers) this.isFull = true;
    }
    removePlayer(socket) {
        socket.leave(this.id);
        if(!socket.userID) return 'no userID';
        let playerIndex = this.game.players.findIndex(player => player.id === socket.userID);
        if(playerIndex === -1) return 'not in room ' + this.id;
        this.game.players.splice(playerIndex, 1);
        this.isFull = false;
        if(this.game.players.length === 0) { // close when only bots
            //this.closeRoom();
            return 'removed last player ' + socket.userID + '. Room ' + this.id + ' closed';
        }
        return 'player ' + socket.userID + ' removed from room ' + this.id;
    }
    removeBot(){
        const botIndex = this.game.players.findLastIndex(player => player.isBot);
        if(botIndex === -1) return { removed: false,
            message: 'no bot in room ' + this.id,
        };
        const bot = this.game.players[botIndex];
        this.game.players.splice(botIndex, 1);
        this.isFull = false;
        return { removed: true,
            message: 'bot ' + bot.name + ' removed from room ' + this.id,
            botID: bot.id
        };
    }

    closeRoom() {
        throw new Error('Not implemented');
    }
}

module.exports = Room;