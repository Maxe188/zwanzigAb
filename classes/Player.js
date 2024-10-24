module.exports = class Player {
    constructor(nickname, hand = []) {
        this.nickname = nickname;
        this.hand = hand; // list max 5
    }

    playCard(card) {
        if (this.hand.includes(card)) {
            this.hand.remove(card);
        }
    }

    getCard(card) {
        if (this.hand.push(card) > 5) { console.log("too many cards on your hand") };
    }

    trade(cards) { } //max 5 check if there are enouth and cap it if nessecery

    toString() {
        return this.nickname + ": " + this.hand.toString();
    }
}