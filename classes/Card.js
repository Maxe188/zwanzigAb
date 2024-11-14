const Round = require("./Round");

const Card = class {
    number = WERT.UNDEFINIERT;
    color = FARBE.UNDEFINIERT;
    ownerId;
    /**
     * Represents a Doppelkopf Karte
     * @param {number} number number to represent the value between 1 - 7
     * @param {number} color one of 4 colors 1 - 4
     * @param {boolean} visible if turnd over
     */
    constructor(number, color, visible) {
        this.number = number;
        this.color = color;
        this.visible = visible;
    }
    toString(){
        return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
    }

    /**
     * Function to compate cards as numbers
     * @param {Round} inRound round in which it is played
     * @returns {number} if trumpf 100-700 else if angegeben 10-70 else 1-7
     */
    cardToNum(inRound){
        let value = this.number;
        if(this.color == inRound.trumpf) value *= 100;
        else if(this.color == inRound.farbeZumAngeben) value *= 10;
        return value;
    }
}

/**
 * Creates a deck of 48 cards (two decks with 24 cards)
 * @returns {Card[]} A list of Card objects
 */
function createDeck() {
    tempDeck = [];
    for (i = 0; i < 2; i++) {
        for (c = 1; c <= 4; c++) {
            for (n = 1; n <= 6; n++) {
                tempDeck[(c - 1) * 6 + (n - 1) + i * 24] = new Card(n, c, false);
            }
        }
    }
    return tempDeck;
}

const FARBE = {
    EICHEL: 1,
    SCHIPP: 2,
    HERZ: 3,
    SCHELLEN: 4,
    UNDEFINIERT: 5
};

const WERT = {
    SIEBEN: 1,
    UNTER: 2,
    OBER: 3,
    KOENIG: 4,
    ZEHN: 5,
    ASS: 6,
    UNDEFINIERT: 7
};
module.exports = {
    Card,
    createDeck,
    FARBE,
    WERT
}