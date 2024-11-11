module.exports = class Game {
    running = false;
    dealingPlayerIndex = 0;
    dealingPlayer = null;
    trumpfPlayer = null;
    currentPlayer = null; //current player obj in players
    leaderboard = {}; // leaderboard: row == round  column == data
    round = 1; // game round

    state = 0; // STATES at the end of file

    currentRound = null;

    constructor(players, deck, used, center, currentRound) {
        this.players = players; // list of Player obj
        this.deck = deck; // list of Card obj
        this.used = used; // list "
        this.center = center; // list order matters "
        this.currentRound = currentRound; // Round obj
    }

    Start() {
        this.running = true;
        this.updateLeaderboard();
        this.shuffleCards(this.deck);
        this.currentPlayer = this.players[0];
        this.dealingPlayer = this.players[this.dealingPlayerIndex];
        this.trumpfPlayer = this.players[this.dealingPlayerIndex + 1];
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
    setTrumpf(color){
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
        for (let rowIndex = 0; rowIndex < this.round; rowIndex++) {
            let row = {};
            for (let index = 0; index < this.players.length; index++) {
                const playerScore = (this.players[index]).score;
                row[index] = playerScore;
            }
            this.leaderboard[rowIndex] = row;
        }
    }

    nextPlayer() {
        this.currentRound.NextTurn()
        this.currentPlayer = this.players[this.currentRound.turn];
    }
    nextRound() {
        this.round++;
        if (this.dealingPlayerIndex < this.players.length) {
            this.dealingPlayerIndex++;
        } else {
            this.dealingPlayerIndex = 0;
        }
        this.trumpfPlayer = this.players[(this.dealingPlayerIndex + 1) % this.players.length];
        this.dealingPlayer = this.players[this.dealingPlayerIndex];
    }

    PlayCard(player, card) {
        if (player === this.currentPlayer) {
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