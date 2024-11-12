class FrontendCard {
    constructor(number, color) {
        this.number = number;
        this.color = color;
    }
    
    static toCardString(card){
        return "[" + (Object.keys(WERT)).at(card.number - 1) + " " + Object.keys(FARBE).at(card.color - 1) + "]";
    }

    static indexToColorString(index){
        return Object.keys(FARBE).at(index - 1).toString();
    }

    static toImgUrl(card){
        let path = "/pictures/";
        switch (card.color) {
            case 1:
                switch (card.number) {
                    case 1:
                        path += "error";
                    case 2:
                        path += "error";
                    case 3:
                        path += "error";
                    case 4:
                        path += "error";
                    case 5:
                        path += "error";
                    case 6:
                        path += "error";
                }
                break;
            case 2:
                switch (card.number) {
                    case 1:
                        path += "error";
                    case 2:
                        path += "error";
                    case 3:
                        path += "error";
                    case 4:
                        path += "error";
                    case 5:
                        path += "error";
                    case 6:
                        path += "error";
                }
                break;
            case 3:
                switch (card.number) {
                    case 1:
                        path += "error";
                    case 2:
                        path += "error";
                    case 3:
                        path += "error";
                    case 4:
                        path += "error";
                    case 5:
                        path += "error";
                    case 6:
                        path += "Herz-Ass";
                }
                break;
            case 4:
                switch (card.number) {
                    case 1:
                        path += "error";
                    case 2:
                        path += "error";
                    case 3:
                        path += "error";
                    case 4:
                        path += "error";
                    case 5:
                        path += "error";
                    case 6:
                        path += "error";
                }
                break;
            default:
                return "not valid";
        }
        path += ".webp";
        return path;
    }

    static toAscii(card) {
        switch (card.color) {
            case 1:
                switch (card.number) {
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
                switch (card.number) {
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
                switch (card.number) {
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
                switch (card.number) {
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
            default:
                return "not valid";
        }
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