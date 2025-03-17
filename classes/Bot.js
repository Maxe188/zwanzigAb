class Bot {
    name = 'bot';
    difficulty = DIFFICULTYS.EASY;
    constructor(name, difficulty) {
        this.name = name;
        this.difficulty = difficulty;
    }

    chooseTrumpf(cards) {
        switch (this.difficulty) {
            case DIFFICULTYS.RANDOM:
                return Math.floor(Math.random() * 4) + 1; // random 1-4
                break;
            case DIFFICULTYS.EASY:
                colorValues = [0, 0, 0, 0];
                for(const card of cards) {
                    colorValues[card.color - 1] += card.value;
                }
                const indexOfMax = this.#indexOfMax(colorValues);
                return indexOfMax; // returns color  // index??
                break;
            default:
                console.log('error: invalid difficulty');
                break;
        }
    }

    chooseCard(center, hand, currentTurn, round) {
        // possible cards to play
        var possibleCards = [];
        for(const card of hand) {
            if(this.#isValidCard(hand, card, currentTurn, round)) possibleCards.push(card);
        }

        switch (this.difficulty) {
            case DIFFICULTYS.RANDOM:
                return hand.findIndex(Math.floor(Math.random() * possibleCards.length)); // random 0-hand.length
                break;
            case DIFFICULTYS.EASY:
                // best card
                return hand.findIndex(bestCard); // index??
                break;
            default:
                console.log('error: invalid difficulty');
                break;
        }
    }

    #indexOfMax(arr) {
        if (arr.length === 0) {
            return -1;
        }
    
        var max = arr[0];
        var maxIndex = 0;
    
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i;
                max = arr[i];
            }
        }
    
        return maxIndex;
    }
    #isValidCard(hand, testingCard, currentTurn, round) {
        // check if card is legal to play
        if(turn === 0) return true;
        if(hand.some(card => card.color === round.farbeZumAngeben)){
            return (testingCard.color === round.farbeZumAngeben);
        } else { // check if player has to otherwise play trumpf
            if(hand.some(card => card.color === round.trumpf)){
                return (testingCard.color === round.trumpf);
            }
        }
        return true;
    }
}

const DIFFICULTYS = {
    RANDOM: 0,
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
};