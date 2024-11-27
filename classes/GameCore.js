const { Card, createDeck, FARBE, WERT } = require("./Card");
const Round = require("./Round");

// future: make things private with #

module.exports = class Game {
    #running = false;
    #debugGame = false;
    #roundOver = false;
    #lastTurn = false;
    dealingPlayerIndex = -1;
    dealingPlayer = null;
    trumpfPlayer = null;
    turn = 0;
    lap = 0;
    offset = 0;
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
        this.#running = true;
        this.#debugGame = debugging;
        this.updateLeaderboard();
        this.#shuffleCards(this.deck);
        this.currentPlayer = this.players[this.turn];
        this.trumpfPlayer = this.players[(this.dealingPlayerIndex + 1) % this.players.length];
        this.currentRound = new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT);
        if (this.#debugGame) {
            this.dealingPlayer = this.players[0];
        } else {
            this.dealingPlayer = this.players[(this.dealingPlayerIndex + this.players.length) % this.players.length];
        }
    }
    Stop() {
        this.#running = false;
    }

    dealThree() {
        this.state = STATES.DEAL;
        this.players.forEach(player => {
            this.#dealCards(player, 3);
        });
    }
    setTrumpf(color) {
        this.state = STATES.DEAL;
        this.currentRound.trumpf = color;
    }
    dealTwo() {
        this.state = STATES.DEAL;
        this.players.forEach(player => {
            this.#dealCards(player, 2);
            player.hand.sort((b, a) => a.cardToNum(this.currentRound) - b.cardToNum(this.currentRound));
        });
    }

    #dealCards(recivingPlayer, numberOfCards) {
        for (let i = 0; i < numberOfCards; i++) recivingPlayer.getCard(this.deck.pop());
    }

    playerTrades(playerIndex, indices){
        this.players[playerIndex].trade(indices, this.deck, this.used);
        this.players[playerIndex].hand.sort((b, a) => a.cardToNum(this.currentRound) - b.cardToNum(this.currentRound));
    }

    updateLeaderboard() {
        let rowIndex = this.round - 1;
        let row = {};
        for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
            let player = this.players[playerIndex];
            console.log(this.leaderboard);
            const playerScore = (this.#hasNoProperties(this.leaderboard) && (this.leaderboard[rowIndex])[playerIndex] === '-') ? '-' : player.score;
            row[playerIndex] = playerScore;
        }
        this.leaderboard[rowIndex] = row;
        let nextRow = {};
        for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
            let player = this.players[playerIndex];
            const playerScore = player.notParticipating ? '-' : '?';
            nextRow[playerIndex] = playerScore;
        }
        this.leaderboard[rowIndex + 1] = nextRow;
    }

    #nextPlayer() {
        do {
            if (this.turn < this.players.length - 1) { // I dont understand why it works but it does
                if(this.turn === 0) this.currentRound.farbeZumAngeben = this.center[0].color;
                this.turn++;
            } else {
                this.#lastTurn = true;

                // find highest card
                let highestIndex = 0;
                let highest = this.center[0].cardToNum(this.currentRound);
                for(let i = 1; i < this.center.length; i++) {
                    const cardAsNum = this.center[i].cardToNum(this.currentRound);
                    if(cardAsNum > highest) {
                        highest = cardAsNum;
                        highestIndex = i;
                    }
                }
                // add stich to owner of the card
                const ownerIndex = this.players.findIndex(player => player.id == this.center[highestIndex].ownerId);
                this.offset = ownerIndex;
                console.log('offset: ' + this.offset);
                const owner = this.players[ownerIndex];
                owner.stiche++;
                // check for new round
                this.lap++;
                if(this.lap === 5){
                    this.lap = 0;
                    this.#roundOver = true;
                }

                this.turn = 0;
            }
            if(this.currentPlayer.notParticipating || !(this.#roundOver)) this.#updateCurrentPlayer();
        } while(this.currentPlayer.notParticipating);
        return this.#roundOver;
    }

    #updateCurrentPlayer(){
        let currentPlayerIndex = (((this.lap === 0 ? this.dealingPlayerIndex + 1 : this.offset) + this.turn) % this.players.length);
        console.log('next player as index: ' + currentPlayerIndex+' because of: ((('+this.turn+' === 0 ? '+this.dealingPlayerIndex+' + 1 : '+this.offset+') + '+this.turn+') % '+this.players.length+')');
        this.currentPlayer = this.players[currentPlayerIndex];
        this.currentPlayer ? {} : console.log('player error');
    }

    triggerLastTurn(){
        if(!(this.#lastTurn)) return;
        this.#lastTurn = false;
        // clear center
        for(let card in this.center) this.used.push(card);
        this.center = [];
        if(this.#roundOver) this.triggerNewRound();
    }

    triggerNewRound(){  // future: test and remove if not needed
        if(!(this.#roundOver)) return;
        this.#roundOver = false;
        this.#nextRound();
        this.#updateCurrentPlayer();
    }

    #nextRound() {
        this.round++;
        this.currentRound = new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT);
        this.players.forEach((player) => player.newRound());
        this.deck = createDeck();
        this.#shuffleCards(this.deck);

        if (this.dealingPlayerIndex < this.players.length - 1) {
            this.dealingPlayerIndex++;
        } else {
            this.dealingPlayerIndex = 0;
        }

        if (this.#debugGame) {
            this.trumpfPlayer = this.players[this.dealingPlayerIndex];
        } else {
            // formula to get the player before the dealing player: needed because -1 is out of index and with that formula it gives the last index :)
            this.trumpfPlayer = this.players[(this.dealingPlayerIndex + 1) % this.players.length];
        }
        this.dealingPlayer = this.players[this.dealingPlayerIndex];
    }

    checkAndPlayCard(player, cardIndex) {
        if(this.#roundOver || this.#lastTurn) return 'too soon';
        const card = this.currentPlayer.hand[cardIndex];
        if (player !== this.currentPlayer) {
            console.log("wrong player");
            return 'not your turn';
        }
        if (!(this.#isValidCard(card))) {
            console.log("not valid card");
            return 'not valid card';
        }
        this.currentPlayer.playCard(cardIndex);
        this.center.push(card);
        if(this.#nextPlayer()) return 'new round';
        return 'played';
    }
    #isValidCard(testingCard) {
        if(this.#debugGame) return true;
        // check if player has to play spacific color
        if(this.turn === 0) return true;
        if(this.currentPlayer.hand.some(card => card.color === this.currentRound.farbeZumAngeben)){
            return (testingCard.color === this.currentRound.farbeZumAngeben);
        } else { // check if player has to otherwise play trumpf
            if(this.currentPlayer.hand.some(card => card.color === this.currentRound.trumpf)){
                return (testingCard.color === this.currentRound.trumpf);
            }
        }
        return true;
    }

    get didSomeoneWin() {
        return !(this.players.every(player => player.score > 0));
    }

    get isRunning() {
        return this.#running;
    }

    #hasNoProperties(){
        return !(Object.keys(this.leaderboard).length === 0);
    }

    checkAllCards() {
        // future: check total amount of cards and if every card exists and every card only once
    }

    #shuffleCards(cardsToShuffle) {
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