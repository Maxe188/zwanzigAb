module.exports = class Player {
    hand = [];
    stiche = 0;
    score = 20;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    playCard(card) {
        if (this.hand.includes(card)) {
            this.hand.remove(card);
        }
    }

    getCard(card) {
        if (this.hand.push(card) > 5) { console.log("too many cards on your hand") };
    }

    trade(cards) { console.log(cards); } //max 5 check if there are enouth and cap it if nessecery

    toString() {
        return this.name + ": " + this.hand.toString();
    }
}