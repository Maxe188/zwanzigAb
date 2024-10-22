module.exports = class Card {
    constructor(number, color) {
        this.number = number;
        this.color = color;
    }
    /*
    toString(){
        return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
    }
    */
    toString() {
        switch (this.color) {
            case 1:
                switch (this.number) {
                    case 1:
                        return "🃗";
                    case 2:
                        return "🃛";
                    case 3:
                        return "🃝";
                    case 4:
                        return "🃞";
                    case 5:
                        return "🃚";
                    case 6:
                        return "🃑";
                }
                break;
            case 2:
                switch (this.number) {
                    case 1:
                        return "🂧";
                    case 2:
                        return "🂫";
                    case 3:
                        return "🂭";
                    case 4:
                        return "🂮";
                    case 5:
                        return "🂪";
                    case 6:
                        return "🂡";
                }
                break;
            case 3:
                switch (this.number) {
                    case 1:
                        return "🂷";
                    case 2:
                        return "🂻";
                    case 3:
                        return "🂽";
                    case 4:
                        return "🂾";
                    case 5:
                        return "🂺";
                    case 6:
                        return "🂱";
                }
                break;
            case 4:
                switch (this.number) {
                    case 1:
                        return "🃇";
                    case 2:
                        return "🃋";
                    case 3:
                        return "🃍";
                    case 4:
                        return "🃎";
                    case 5:
                        return "🃊";
                    case 6:
                        return "🃁";
                }
                break;
        }
    }
}
module.exports =  FARBE = {
    EICHEL: 1,
    SCHIPP: 2,
    HERZ: 3,
    SCHELLEN: 4
};
module.exports =  WERT = {
    SIEBEN: 1,
    UNTER: 2,
    OBER: 3,
    KOENIG: 4,
    ZEHN: 5,
    ASS: 6
};
