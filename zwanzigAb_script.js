class Player {
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
class round {
    constructor(superiorColor, firstColor) {
        this.superiorColor = superiorColor;
        this.firstColor = firstColor;
    }
}
class Game {
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
    

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
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

//const game = new Game(["a", "b"], [new Card(WERT.ASS, FARBE.EICHEL), new Card(WERT.SIEBEN, FARBE.SCHELLEN)], [], [], -1, "a");
const game = new Game([new Player("A"), new Player("B"), new Player("C")], createDeck(), [], [], 0, new Player("H"));
document.getElementById("before").innerHTML = game.deck.toString();
game.shuffleDeck(game.deck);
game.GiveThree();
game.GiveThree();
game.GiveThree();
document.getElementById("after").innerHTML = game.deck.toString();
document.getElementById("A").innerHTML = game.players[0];
document.getElementById("B").innerHTML = game.players[1];
document.getElementById("C").innerHTML = game.players[2];