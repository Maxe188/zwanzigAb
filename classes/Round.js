module.exports = class Round {
    turn = 0; // players turn
    constructor(trumpf,farbeZumAngeben) {
        this.trumpf = trumpf;
        this.farbeZumAngeben = farbeZumAngeben;
    }

    NextTurn(){
        this.turn++;
    }
    get Turn(){
        return this.turn;
    }
}
