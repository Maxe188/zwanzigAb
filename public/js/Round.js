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
        this.turn++;
    }
    get GetTurn(){
        return this.turn;
    }
}