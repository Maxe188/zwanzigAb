const { FARBE } = require('./Card.js');

class BotEngine {
    difficulty = DIFFICULTYS.EASY;
    constructor(difficulty = DIFFICULTYS.EASY) {
        this.difficulty = difficulty;
    }

    chooseTrumpf(cards) {
        switch (this.difficulty) {
            case DIFFICULTYS.RANDOM:
                return Math.floor(Math.random() * 4) + 1; // random 1-4
            case DIFFICULTYS.EASY:
                let colorCount = [0, 0, 0, 0];
                for(const card of cards) {
                    colorCount[card.color - 1] += 1;
                }
                const indexOfMaxCount = this.#findIndexOfMax(colorCount);
                return indexOfMaxCount + 1; // returns index of most cards of a color in hand or first if equal
            case DIFFICULTYS.MEDIUM:
                /*
                let colorValues = [0, 0, 0, 0];
                for(const card of cards) {
                    colorValues[card.color - 1] += card.value;
                }
                const indexOfMaxValue = this.#findIndexOfMax(colorValues);
                return indexOfMaxValue + 1; // returns index of max summed values of each color
                */
                throw new Error('not implemented');
            case DIFFICULTYS.HARD:
                throw new Error('not implemented');
            default:
                console.log('bot trumpf error: invalid difficulty');
                break;
        }
    }

    // future validate
    chooseCardsToTrade(hand, trumpf) {
        let indices = [];

        switch (this.difficulty) {
            case DIFFICULTYS.RANDOM:
                let randomIndex = Math.floor(Math.random() * hand.length);
                for(let i = randomIndex; i < 5; i++) {
                    indices.push(i);
                }
                return indices;
                break;
            case DIFFICULTYS.EASY:
                let lowestNotTrumpfIndex = -1;
                for(let i = 0; i < hand.length; i++) {
                    if(hand[i].color == trumpf) { 
                        lowestNotTrumpfIndex = i;
                    }
                }
                for(let i = lowestNotTrumpfIndex + 1; i < 5; i++) {
                    indices.push(i);
                }
                return indices;
            case DIFFICULTYS.MEDIUM:
                throw new Error('not implemented');
            case DIFFICULTYS.HARD:
                throw new Error('not implemented');
            default:
                console.log('bot trade error: invalid difficulty');
                break;
        }
    }

    chooseCard(center, hand, round) {
        // possible cards to play
        var possibleCards = []; // highest to lowest
        for(const card of hand) {
            if(this.#isValidCard(hand, card, round)) possibleCards.push(card);
        }
        console.log('possibleCards: ' + possibleCards.toString() + ' round: ' + round.farbeZumAngeben + ' trumpf: ' + round.trumpf);

        switch (this.difficulty) {
            case DIFFICULTYS.RANDOM:
                return hand.findIndex(card => card === possibleCards[Math.floor(Math.random() * possibleCards.length)]); // random out of possible cards
                break;
            case DIFFICULTYS.EASY:
                // if current highest card on the table is beatable, play my lowest card that beats it, otherwise play my lowest card
                
                if(center.length === 0) {
                    // if no card has been played yet, play random card
                    let handIndex = Math.floor(Math.random() * hand.length);
                    return handIndex;
                }
                
                const highestInCenter = center.length > 0 ? this.#highestCardValue(center, round) : 0;
                let cardToPlay = null;

                for (let i = 0; i < possibleCards.length; i++) {
                    if(possibleCards[i].cardToNum(round) > highestInCenter) {
                        cardToPlay = possibleCards[i];
                    } else if (cardToPlay === null) {
                        cardToPlay = possibleCards[possibleCards.length - 1];
                        break;
                    }
                }

                return hand.findIndex(card => card === cardToPlay);
                break;
            case DIFFICULTYS.MEDIUM:
                throw new Error('not implemented');
            case DIFFICULTYS.HARD:
                throw new Error('not implemented');
            default:
                console.log('bot play error: invalid difficulty');
                break;
        }
    }

    #highestCardValue(cards, round) {
        let highest = cards[0].cardToNum(round);
        for(const card of cards) {
            const cardAsNum = card.cardToNum(round);
            if(cardAsNum > highest) {
                highest = cardAsNum;
            }
        }
        return highest;
    }

    #findHighestCard(cards, round) {
        let highestIndex = 0;
        let highest = cards[0].cardToNum(round);
        for(let i = 1; i < cards; i++) {
            const cardAsNum = cards[i].cardToNum(round);
            if(cardAsNum > highest) {
                highest = cardAsNum;
                highestIndex = i;
            }
        }
        return highestIndex;
    }

    #findIndexOfMax(arr) {
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
    #isValidCard(hand, testingCard, round) {
        // check if card is legal to play
        if(round.farbeZumAngeben === FARBE.UNDEFINIERT) return true; // if no color has been played yet, any card is valid
        if(hand.some(card => card.color === round.farbeZumAngeben)){
            return (testingCard.color === round.farbeZumAngeben);
        } else if (hand.some(card => card.color === round.trumpf)){ // check if player has to otherwise play trumpf
            return (testingCard.color === round.trumpf);
        }
        return true;
    }
}

const DIFFICULTYS = {
    RANDOM: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
};

module.exports = {
    BotEngine,
    DIFFICULTYS 
};