const { Card, createDeck, FARBE, WERT } = require("./Card");
const Round = require("./Round");

// future: make things private with #

/**
 * Represents a Game
 * @class Game
 * @property {boolean} #running If the game is running
 * @property {boolean} #debugGame If the game is in debug mode
 * @property {boolean} #roundOver If the round is over
 * ...
 */
class Game {
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
        this.state = STATES.DEAL_THREE;
    }
    Stop() {
        this.#running = false;
        this.reset();
    }
    reset() {
        this.#running = false;
        this.#debugGame = false;
        this.#roundOver = false;
        this.#lastTurn = false;
        this.dealingPlayerIndex = -1;
        this.dealingPlayer = null;
        this.trumpfPlayer = null;
        this.turn = 0;
        this.lap = 0;
        this.offset = 0;
        this.currentPlayer = null;
        this.leaderboard = {};
        this.round = 1;
        this.state = 0;
        this.currentRound = null;
        this.players = [];
        this.deck = [];
        this.used = [];
        this.center = [];
    }

    dealThree() {
        this.state = STATES.SET_TRUMPF;
        this.players.forEach(player => {
            this.#dealCards(player, 3);
        });
    }
    setTrumpf(color) {
        this.state = STATES.DEAL_TWO;
        this.currentRound.trumpf = color;
    }
    theFourthCard() {
        const currentPlayerIndex = this.players.findIndex(player => player.id == this.currentPlayer.id);
        const card = this.deck[this.deck.length - 1 - currentPlayerIndex];
        let cardCopy = {
            color: card.color,
            number: card.number
        };
        console.log(cardCopy);
        return cardCopy;
    }
    dealTwo() {
        this.state = STATES.TRADE_CARDS;
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            this.#dealCards(player, 2);
            player.hand.sort((b, a) => a.cardToNum(this.currentRound) - b.cardToNum(this.currentRound));
        }
    }

    #dealCards(recivingPlayer, numberOfCards) {
        for (let i = 0; i < numberOfCards; i++) recivingPlayer.getCard(this.deck.pop());
    }

    playerTrades(player, indices){
        player.trade(indices, this.deck, this.used);
        player.hand.sort((b, a) => a.cardToNum(this.currentRound) - b.cardToNum(this.currentRound));
    }
    playerDoNotParticipate(player){
        if(player === this.trumpfPlayer) return false;
        //if(this.players.every((otherPlayer) => otherPlayer !== this.trumpfPlayer && otherPlayer.traded)) return false;   dont know if it workes or does anything
        player.doNotParticipate(this.used);
        return true;
    }

    updateLeaderboard() {
        let rowIndex = this.round - 1 + 1; // -1 because round starts at 1 but array at 0, and +1 because of the row with names
        if (rowIndex === 1) {
            let nameRow = {};
            for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
                let player = this.players[playerIndex];
                nameRow[playerIndex] = player.name;
            }
            this.leaderboard[0] = nameRow;
        }
        let row = {};
        for (let playerIndex = 0; playerIndex < this.players.length; playerIndex++) {
            let player = this.players[playerIndex];
            const playerScore = (this.leaderboard[1] && (this.leaderboard[rowIndex])[playerIndex] === '-') ? '-' : player.score;
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
                //console.log('offset: ' + this.offset);
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
        //console.log('next player as index: ' + currentPlayerIndex+' because of: ((('+this.turn+' === 0 ? '+this.dealingPlayerIndex+' + 1 : '+this.offset+') + '+this.turn+') % '+this.players.length+')');
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
        this.state = STATES.DEAL_THREE;
    }

    #nextRound() {
        this.round++;
        this.currentRound = new Round(FARBE.UNDEFINIERT, FARBE.UNDEFINIERT);
        this.players.forEach((player) => player.newRound());
        this.deck = createDeck();
        this.used = [];
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
        if(!(this.players.every((p) => p.traded == true))){
            return 'too soon';
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
    DEAL_TWO: 1,
    SET_TRUMPF: 2,
    TRADE_CARDS: 3,
    PLAY: 4,
    DEAL_THREE: 5,
    READY: 6
};

module.exports = {
    Game,
    STATES
}