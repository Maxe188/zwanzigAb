const Game  = class {
    constructor(players, deck, used, center, currentRound, currentPlayer) {
        this.players = players;
        this.deck = deck; // list
        this.used = used; // list
        this.center = center; // list order matters
        this.currentRound = currentRound;
        this.currentPlayer = players[0];

        if (deck == null) {
            createDeck(deck);
        }
    }

    nextPlayer() {
        this.players.unshift(this.players.pop());

        this.currentPlayer = this.players[0];
    }

    isValidCard(card) {
        return (true);                  //...
    }

    PlayCard(player, card) {
        if (player == this.currentPlayer) {
            if (this.isValidCard(card)) {
                this.currentPlayer.play(card);
                this.center.push(card);
                this.nextPlayer();
            } else {
                console.log("not valid card");
            }
        } else {
            console.log("wrong player");
        }
    }
    GiveThree() {
        for (let i = 0; i < 3; i++) {
            this.currentPlayer.getCard(this.deck.pop());
        }
        this.nextPlayer();
    }
    

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
}

function createDeck() {
    tempDeck = [];
    for (c = 1; c <= 4; c++) {
        for (n = 1; n <= 6; n++) {
            tempDeck[(c - 1) * 6 + (n - 1)] = new Card(n, c);
        }
    }
    return tempDeck;
}

module.exports = {
    Game,
    createDeck
}