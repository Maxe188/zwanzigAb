const Card = class {
    constructor(number, color, visible) {
        this.number = number;
        this.color = color;
        this.visible = visible;
    }
    toString(){
        return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
    }
}
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