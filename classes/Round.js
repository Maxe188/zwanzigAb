class Round {
    turn = 1;
    dominantColor;
    constructor(superiorColor) {
        this.superiorColor = superiorColor;
    }
    SetDominantColor(color){
        this.dominantColor = color;
    }
    get DominantColor(){
        return this.dominantColor;
    }

    NextTurn(){
        turn++;
    }
    get Turn(){
        return this.turn;
    }
}
