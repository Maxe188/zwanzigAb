class FrontendCard {
    constructor(number, color) {
        this.number = number;
        this.color = color;
    }
    
    static toCardString(card){
        if((card.number <= 0 || card.number > Object.keys(WERT).length) || (card.color <= 0 || card.color > Object.keys(FARBE).length)) return 'not valid card';
        return "[" + (Object.keys(WERT)).at(card.number - 1) + " " + Object.keys(FARBE).at(card.color - 1) + "]";
    }

    static indexToColorString(index){
        return (Object.keys(FARBE).at(index - 1)).toString();
    }

    static colorUrl(color){
        let path = "/pictures/colors/";
        switch (color) {
            case 1:
                path += "Bay_eichel.svg";
                break;
            case 2:
                path += "Bay_schipp.svg";
                break;
            case 3:
                path += "Bay_herz.svg";
                break;
            case 4:
                path += "Bay_schellen.svg";
                break;
            case 5:
                path += "question-mark.png";
                break;
            default:
                return "not valid";
        }
        return path;
    }

    static backImgUrl(){
        return "/pictures/card_images/back.png";
    }

    static toImgUrl(card){
        let path = "/pictures/card_images/";
        switch (card.color) {
            case 1:
                path += "Eichel_";
                switch (card.number) {
                    case 1:
                        path += "sieben";
                        break;
                    case 2:
                        path += "unter";
                        break;
                    case 3:
                        path += "ober";
                        break;
                    case 4:
                        path += "koenig";
                        break;
                    case 5:
                        path += "zehn";
                        break;
                    case 6:
                        path += "ass";
                        break;
                }
                break;
            case 2:
                path += "Schipp_";
                switch (card.number) {
                    case 1:
                        path += "sieben";
                        break;
                    case 2:
                        path += "unter";
                        break;
                    case 3:
                        path += "ober";
                        break;
                    case 4:
                        path += "koenig";
                        break;
                    case 5:
                        path += "zehn";
                        break;
                    case 6:
                        path += "ass";
                        break;
                }
                break;
            case 3:
                path += "Herz_";
                switch (card.number) {
                    case 1:
                        path += "sieben";
                        break;
                    case 2:
                        path += "unter";
                        break;
                    case 3:
                        path += "ober";
                        break;
                    case 4:
                        path += "koenig";
                        break;
                    case 5:
                        path += "zehn";
                        break;
                    case 6:
                        path += "ass";
                        break;
                }
                break;
            case 4:
                path += "Schellen_";
                switch (card.number) {
                    case 1:
                        path += "sieben";
                        break;
                    case 2:
                        path += "unter";
                        break;
                    case 3:
                        path += "ober";
                        break;
                    case 4:
                        path += "koenig";
                        break;
                    case 5:
                        path += "zehn";
                        break;
                    case 6:
                        path += "ass";
                        break;
                }
                break;
            default:
                return "not valid";
        }
        path += ".png";
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