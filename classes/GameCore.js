const { FARBE } = require("./Card");
const Round = require("./Round");

module.exports = class Game {
    running = false;
    debugGame = false;
    dealingPlayerIndex = -1;
    dealingPlayer = null;
    trumpfPlayer = null;
    turn = 0;
    currentPlayer = null; //current player obj in players
    leaderboard = {}; // leaderboard: row == round  column == data
    round = 1; // game round

    state = 0; // STATES at the end of file

    currentRound = null;

    /**
     * Represents a Game
     * @param {Player[]} players The list of Player currently playing
     * @param {Card[]} deck The list of Card not used
     * @param {Card[]} used The list of Card used
     * @param {Card[]} center The list of Cards on the table (order matters)
     * @param {Round} currentRound The current Round
     */
    constructor(players, deck, used, center, currentRound) {
        this.players = players; // list of Player obj
        this.deck = deck; // list of Card obj
        this.used = used; // list "
        this.center = center; // list order matters "
        this.currentRound = currentRound; // Round obj
    }

    Start(debugging = false) {
        this.running = true;
        this.debugGame = debugging;
        this.updateLeaderboard();
        this.shuffleCards(this.deck);
        this.currentPlayer = this.players[this.turn];
        this.trumpfPlayer = this.players[0];
        this.currentRound = new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT, this.players);
        if (this.debugGame) {
            this.dealingPlayer = this.players[0];
        } else {
            this.dealingPlayer = this.players[this.players.length - 1];
        }
    }
    Stop() {
        this.running = false;
    }

    dealThree() {
        this.state = STATES.DEAL;
        this.players.forEach(player => {
            this.dealCards(player, 3);
        });
    }
    setTrumpf(color) {
        this.state = STATES.DEAL;
        this.currentRound.trumpf = color;
    }
    dealTwo() {
        this.state = STATES.DEAL;
        this.players.forEach(player => {
            this.dealCards(player, 2);
        });
    }

    dealCards(recivingPlayer, numberOfCards) {
        for (let i = 0; i < numberOfCards; i++) recivingPlayer.getCard(this.deck.pop());
    }

    updateLeaderboard() {
        let rowIndex = this.round - 1;
        let row = {};
        for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
            let player = this.players[playerIndex];
            const playerScore = player.notParticipating ? '-' : player.score;
            row[playerIndex] = playerScore;
        }
        this.leaderboard[rowIndex] = row;
    }

    nextPlayer() {
        do {
            if (this.turn < this.players.length) {
                this.turn++;
            } else {
                this.turn = 0;
            }
            this.currentPlayer = this.players[this.dealingPlayerIndex + 1 + this.turn];
        } while(this.currentPlayer.notParticipating);
    }
    nextRound() {
        this.round++;
        this.currentRound = new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT, this.players);
        this.players.forEach((player) => player.newRound());

        if (this.dealingPlayerIndex < this.players.length) {
            this.dealingPlayerIndex++;
        } else {
            this.dealingPlayerIndex = 0;
        }

        if (this.debugGame) {
            this.trumpfPlayer = this.players[this.dealingPlayerIndex];
        } else {
            // formula to get the player before the dealing player: needed because -1 is out of index and with that formula it gives the last index :)
            this.trumpfPlayer = this.players[(this.dealingPlayerIndex - 1 + this.players.length) % this.players.length];
        }
        this.dealingPlayer = this.players[this.dealingPlayerIndex];
    }

    checkAndPlayCard(player, cardIndex) {
        const card = this.currentPlayer.hand[cardIndex];
        if (player !== this.currentPlayer) {
            console.log("wrong player");
            return;
        }
        if (!(this.isValidCard(card))) {
            console.log("not valid card");
            return;
        }
        this.currentPlayer.playCard(cardIndex);
        this.center.push(card);
        this.nextPlayer();
    }
    isValidCard(testingCard) {
        return true; // future: check farbe und ob trumpf
    }

    checkAllCards() {
        // future: check total amount of cards and if every card exists and every card only once
    }

    shuffleCards(cardsToShuffle) {
        for (let i = cardsToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardsToShuffle[i], cardsToShuffle[j]] = [cardsToShuffle[j], cardsToShuffle[i]];
        }
    }

}
const STATES = {
    DEAL: 1,
    SET_TRUMPF: 2,
    TRADE_CARDS: 3,
    PLAY: 4
};