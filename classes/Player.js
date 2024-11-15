module.exports = class Player {
    hand = [];
    score = 20;
    stiche = 0;
    traded = false;
    notParticipating = false;

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    playCard(cardIndex) {
        // checks if cardIndex is between -1 and hand lenth
        if (this.hand.length > cardIndex && cardIndex >= 0) {
            return this.hand.splice(cardIndex, 1)[0];
        }
        console.log('tried to play card at unvalid index: ' + cardIndex);
        return 'unvalid index';
    }

    getCard(card) {
        if (this.hand.length >= 6) { 
            console.log('too many cards on ' + this.name + '\'s hand');
            return false;
        };
        card.ownerId = this.id;
        this.hand.push(card);
        return true;
    }
    replaceCard(newCard, cardIndex) {
        // checks if cardIndex is outside 0 and hand.lenth-1
        if (cardIndex >= this.hand.length || cardIndex < 0) {
            console.log('tried to play card at unvalid index: ' + cardIndex);
            return 'unvalid index';
        }
        return this.hand.splice(cardIndex, 1, newCard)[0];
    }

    /**
     * plays cards and gets new ones
     * @param {number[]} cardIndices list of cards indices that should be traded
     * @param {Card[]} deck currently used deck to get new cards from
     * @param {Card[]} used where to put used cards
     * @returns {Card[]} list of traded cards
     */
    trade(cardIndices, deck, used) {
        if(this.traded) return;
        // future: max 5 check if there are enouth and cap it if nessecery
        this.traded = true;
        cardIndices.sort(function(a, b){return a - b}); // important in the past, but now only for aesthetic purposes
        console.log('player: ' + this.name + ' trades card: ' + cardIndices);

        let playedCards = [];
        for(let i = cardIndices.length - 1; i >= 0; i--){
            let playedCard = this.replaceCard(deck.pop(), cardIndices[i]);

            playedCards.push(playedCard);
            used.push(playedCard);
        }
        return playedCards;
    }
    doNotParticipate(used){
        if(this.traded) return;
        this.traded = true;
        this.notParticipating = true;
        console.log('player: ' + this.name + ' is out');

        let putAwayCards = [];
        for(let i = this.hand.length - 1; i >= 0; i--){
            let playedCard = this.playCard(i);
            putAwayCards.push(playedCard);
            used.push(playedCard);
        }
        return putAwayCards;
    }

    newRound(){
        if(!(this.notParticipating)){
            if(this.stiche == 0){
                this.score += 5;
            } else {
                this.score -= this.stiche;
            }
        }
        this.stiche = 0;
        this.traded = false;
        this.notParticipating = false;
    }

    toString() {
        return this.name + "\'s hand: " + this.hand.toString();
    }
}