module.exports = class Round {
    turn = 1;
    constructor(trumpf,farbeZumAngeben) {
        this.trumpf = trumpf;
        this.farbeZumAngeben = farbeZumAngeben;
    }

    NextTurn(){
        turn++;
    }
    get Turn(){
        return this.turn;
    }
}
