module.exports = class Card {
    constructor(number, color) {
        this.number = number;
        this.color = color;
    }
    toString(){
        return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
    }
}
const FARBE = {
    EICHEL: 1,
    SCHIPP: 2,
    HERZ: 3,
    SCHELLEN: 4
};
const WERT = {
    SIEBEN: 1,
    UNTER: 2,
    OBER: 3,
    KOENIG: 4,
    ZEHN: 5,
    ASS: 6
};
module.exports += {
    FARBE,
    WERT
}