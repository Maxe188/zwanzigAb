module.exports = class Player {
    hand = [];
    stiche = 0;
    score = 20;
    traded = false;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    playCard(cardIndex) {
        // checks if cardIndex is between 0 and hand lenth
        if (this.hand.length > cardIndex && cardIndex > 0) {
            this.hand.splice(cardIndex, 1);
            return this.hand[cardIndex];
        }
        return 'unvalid index';
    }

    getCard(card) {
        if (this.hand.length >= 6) { 
            console.log('too many cards on ' + this.name + '\'s hand');
            return false;
        };
        this.hand.push(card);
        return true;
    }

    /**
     * plays cards and gets new ones
     * @param {number[]} cardIndices list of cards indices that should be traded
     * @param {Card[]} deck currently used deck to get new cards from
     * @param {Card[]} used where to put used cards
     * @returns {Card[]} list of traded cards
     */
    trade(cardIndices, deck, used) {
        // future: max 5 check if there are enouth and cap it if nessecery
        this.traded = true;
        cardIndices.sort(function(a, b){return a - b});
        console.log('player: ' + this.name + ' trades card: ' + cardIndices);

        let playedCards = [];
        for(let i = cardIndices.length - 1; i >= 0; i--){
            let playedCard = this.playCard(cardIndices[i]);
            playedCards.push(playedCard);
            used.push(playedCard);
            this.getCard(deck.pop());
        }
        return playedCards;
    }

    newRound(){
        this.stiche = 0;
        this.traded = false;
    }

    toString() {
        return this.name + ": " + this.hand.toString();
    }
}