module.exports = class Round {
    turn = 0; // players turn
    constructor(trumpf,farbeZumAngeben, numberOfPlayers) {
        this.trumpf = trumpf;
        this.farbeZumAngeben = farbeZumAngeben;
        this.numberOfPlayers = numberOfPlayers;
    }

    NextTurn(){
        this.turn++;
    }
    get Turn(){
        return this.turn;
    }
}
