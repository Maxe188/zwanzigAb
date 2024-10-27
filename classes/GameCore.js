module.exports = class Game {
    running = false;
    currentPlayer = 0;
    leaderboard = {};
    round = 1;
    constructor(players, deck, used, center, currentRound) {
        this.players = players; // list of Player obj
        this.deck = deck; // list of Card obj
        this.used = used; // list "
        this.center = center; // list order matters "
        this.currentRound = currentRound; // Round obj
    }

    Start(){
        this.running = true;
        this.updateLeaderboard();
    }

    updateLeaderboard(){
        for (let rowIndex = 0; rowIndex < this.round; rowIndex++) {
            let row = [];
            for (let index = 0; index < this.players.length; index++) {
                const playerScore = (this.players[index]).score;
                row[index] = playerScore;
            }
            this.leaderboard[rowIndex] = row;
        }
    }

    nextPlayer() {
        this.currentRound.NextTurn()
        this.currentPlayer = this.players[this.currentRound.turn - 1];
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