const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');
const leaderbordTable = document.getElementById('leaderbordTable');
const usernameInput = document.getElementById('username');
const ownHandDiv = document.getElementById('myself');
const othersDiv = document.getElementById('others');
const centerDiv = document.getElementById('center');

const gameDiv = document.getElementById('gameDiv');

var players = {};
var username = "";

var choosingTrumpf = false;
var tradeing = false;
var playing = false;

var debugGame = false;

var selectedTradingCards = [];
var lastHand;
const rotations = {};

socket.on('name suggestion', (suggestedName) => {
    console.log('name suggestion: ' + suggestedName);
    usernameInput.value = suggestedName;
});

document.getElementById('formName').addEventListener('submit', function (event) {
    event.preventDefault();
    username = usernameInput.value;
    socket.emit('set name', username);
    console.log('Dein Username ist: ' + username + '. Hallo ' + username + '!');
    nameDiv.style.display = 'none';
    readyDiv.style.display = 'block';
});

socket.on('update players', (backendPlayers) => {
    console.log(backendPlayers);
    players = backendPlayers;
    playerList.innerHTML = "";
    for (const id in players) {
        const player = players[id];
        const item = document.createElement('li');
        item.textContent = player.name;
        playerList.appendChild(item);
    }
});
document.getElementById('formStart').addEventListener('submit', function (event) {
    event.preventDefault();
    if (!(Object.keys(players).length >= 2)) return;
    socket.emit('starting game');
});
document.getElementById('formDebugStart').addEventListener('submit', function (event) {
    event.preventDefault();
    socket.emit('starting debug game');
});

socket.on('start game', () => {
    console.log('game started');
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});
socket.on('start debug game', () => {
    debugGame = true;
    console.log('debug game started');
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});
socket.on('game ended', () => {
    console.log('game stoped');
    gameDiv.style.display = 'none';
    socket.disconnect();
    socket.connect();
    // reset
    nameDiv.style.display = 'block';
    document.getElementById('dealThreeMessage').style.display = 'none';
    document.getElementById('trumpfMessage').style.display = 'none';
    document.getElementById('dealTwoMessage').style.display = 'none';
    document.getElementById('tradeMessage').style.display = 'none';
});
socket.on('update leaderboard', (leaderBoard) => {
    console.log(leaderBoard);
    leaderbordTable.innerHTML = "";
    for (let rowIndex = 0; rowIndex <= Object.keys(leaderBoard).length; rowIndex++) {
        const tableRow = document.createElement('tr');
        if (rowIndex == 0) {
            for (const id in players) { // for-in is unorderd
                const player = players[id];
                const tableHead = document.createElement('th');
                if (id === socket.id) tableHead.style.backgroundColor = 'rgba(200,80,80,1)';
                tableHead.textContent = player.name;
                tableRow.appendChild(tableHead);
            }
        } else {
            const rowScores = leaderBoard[rowIndex - 1];
            for (let scoreIndex = 0; scoreIndex < Object.keys(rowScores).length; scoreIndex++) {
                const tableData = document.createElement('td');
                tableData.textContent = rowScores[scoreIndex];
                tableRow.appendChild(tableData);
            }
        }
        leaderbordTable.appendChild(tableRow);
    }
});
socket.on('update trumpf', (trumpfColor) => {
    document.getElementById('theTrumpfDisplay').style.backgroundImage = 'url(' + FrontendCard.toColorUrl(new FrontendCard(-1, trumpfColor)) + ')';
});

socket.on('deal three', () => {
    if (debugGame) {
        console.log('simulate deal btn pressed');
        socket.emit('start dealing three');
        return;
    }
    document.getElementById('dealThreeMessage').style.display = 'flex';
});
document.getElementById('dealThreeButton').onclick = () => {
    socket.emit('start dealing three');
    document.getElementById('dealThreeMessage').style.display = 'none';
}
socket.on('choose trumpf', () => {
    console.log('choose trumpf');
    if (debugGame) {
        socket.emit('set trumpf', Math.floor(Math.random() * 3));
        return;
    }
    choosingTrumpf = true;
    document.getElementById('trumpfMessage').style.display = 'flex';
});
function cardClicked(element) {
    console.log('clicked on card');
    let clickedIndex = parseInt(element.classList[0]);
    if (choosingTrumpf) {
        choosingTrumpf = false;
        console.log('index of clicked card: ' + clickedIndex);
        document.getElementById('trumpfMessage').style.display = 'none';
        socket.emit('set trumpf', clickedIndex);
    } else if (tradeing) {
        element.classList.toggle('selected');
        selectedTradingCards.includes(clickedIndex) ? selectedTradingCards.splice(selectedTradingCards.indexOf(clickedIndex), 1) : selectedTradingCards.push(clickedIndex);
    } else if (playing) {
        console.log('played card: ' + element.innerHTML);
        socket.emit('play card', clickedIndex);
    }
}

socket.on('deal two', () => {
    if (debugGame) {
        console.log('simulate deal btn pressed');
        socket.emit('start dealing two');
        return;
    }
    document.getElementById('dealTwoMessage').style.display = 'flex';
});
document.getElementById('dealTwoButton').onclick = () => {
    socket.emit('start dealing two');
    document.getElementById('dealTwoMessage').style.display = 'none';
}
socket.on('trade', () => {
    selectedTradingCards = [];
    if (debugGame) {
        console.log('simulate no trading');
        socket.emit('enterTrade', [0, 2, 4]);
        return;
    }
    tradeing = true;
    document.getElementById('tradeMessage').style.display = 'flex';
});
document.getElementById('tradeButton').onclick = () => {
    tradeing = false;
    document.getElementById('tradeMessage').style.display = 'none';
    console.log('trade cards: ' + selectedTradingCards)
    socket.emit('enterTrade', selectedTradingCards);
}
document.getElementById('outButton').onclick = () => {
    tradeing = false;
    document.getElementById('tradeMessage').style.display = 'none';
    console.log('you\'re out');
    socket.emit('not participating');
}
socket.on('lets go', () => {
    playing = true;
    const goText = document.createElement('h1');
    goText.textContent = 'Los gehts!!!';
    centerDiv.innerHTML = '';
    centerDiv.appendChild(goText);
});
socket.on('not valid card', (cardIndex) => {
    const cardDiv = ownHandDiv.children[cardIndex].firstChild.firstChild;
    cardDiv.classList.add('notValid');
    setTimeout(() => { cardDiv.classList.remove('notValid') }, 1000);
});
socket.on('won', () => {
    console.log('won');
    alert('you won');
});
socket.on('lost', () => {
    console.log('lost');
    alert('you lost');
});

socket.on('update gameState', (gameState) => {
    // future: show ownStiche
    console.log(gameState);
    createOwnHand(ownHandDiv, gameState);
    othersDiv.innerHTML = createOtherPlayers(gameState);
    createCenter(centerDiv, gameState);
});
function createOwnHand(hand, gameState) {
    if(gameState.currentPlayerName === username) {
        console.log('its your turn');
        if(!(hand.classList.contains('currentPlayer')))hand.classList.add('currentPlayer');
    } else {
        if(hand.classList.contains('currentPlayer')) hand.classList.remove('currentPlayer');
    }

    if (JSON.stringify(gameState.ownHand) === JSON.stringify(lastHand)) return; // cannot simply conpare(==) two arrays because array instances are never the same
    //if(this.trading) return;

    lastHand = gameState.ownHand;
    hand.innerHTML = "";
    
    const numOfCards = gameState.ownHand.length;
    const degOfTilt = 8.5;
    for (let index = 0; index < numOfCards; index++) {
        // first layer: rotatingContainer
        let container = document.createElement('div');
        container.className = 'rotatingContainer';
        const tilt = degOfTilt * index - (degOfTilt * (numOfCards - 1) / 2) + 90;
        container.style = 'transform: rotate(' + (tilt.toString()) + 'deg);';
        // second layer: hoverAndRotateFix
        let fix = document.createElement('div');
        fix.className = 'hoverAndRotateFix';
        // third layer: card hand
        let card = document.createElement('div');
        card.onclick = (event) => cardClicked(event.target);
        card.className = index.toString() + ' card handCard';
        //card.classList.add('cardColor');
        //card.textContent = FrontendCard.toCardString(gameState.ownHand[index]);
        card.style.backgroundImage = 'url(' + FrontendCard.toImgUrl(gameState.ownHand[index]) + ')';

        fix.appendChild(card);
        container.appendChild(fix);

        hand.appendChild(container);
    }
}
function createOtherPlayers(gameState) {
    playerContainer = "";
    const numOfOtherPlayers = Object.keys(gameState.otherPlayers).length;
    const ownIndex = Object.keys(gameState.otherPlayers).findIndex(playerName => gameState.otherPlayers[playerName] === 'you');
    const degOfRotation = 360 / numOfOtherPlayers;
    for (let playerI = 0; playerI < numOfOtherPlayers; playerI++) {
        const playerName = Object.keys(gameState.otherPlayers)[playerI];
        const otherPlayer = gameState.otherPlayers[playerName];
        if(gameState.otherPlayers[playerName] === 'you') {
            rotations[username] = 0;
            continue;
        }
        const numOfCards = otherPlayer.handCount;
        const numOfStiche = otherPlayer.stichCount;
        // first layer: playerDiv
        let playerDiv = document.createElement('div');
        playerDiv.className = 'otherPlayer';
        const rotation = (degOfRotation * playerI * (-1)) + (degOfRotation * ownIndex);
        //console.log('rotation: ' + rotation+' because of: ('+degOfRotation+' * '+playerI+' * (-1)) + ('+degOfRotation+' * '+playerI+')');
        rotations[playerName] = rotation; // !!!
        playerDiv.style = 'transform: rotate(' + (rotation.toString()) + 'deg) translate(-300px) rotate(90deg) scale(0.8);';
        if(gameState.currentPlayerName === playerName) {
            console.log('current player: ' + playerName);
            playerDiv.classList.add('currentPlayer');
        }
        // second layer: playerHead
        let head = document.createElement('div');
        let playerNameH3 = document.createElement('h3');
        playerNameH3.innerText = playerName + ' ' + numOfStiche.toString();
        head.appendChild(playerNameH3);
        // second layer: otherHand
        let otherHand = document.createElement('div');
        otherHand.className = 'otherHand';

        const degOfTilt = 10;
        for (let index = 0; index < numOfCards; index++) {
            // first layer: rotatingContainer
            let container = document.createElement('div');
            container.className = 'rotatingContainer';
            const tilt = degOfTilt * index - (degOfTilt * (numOfCards - 1) / 2) + 90;
            container.style = 'transform: rotate(' + (tilt.toString()) + 'deg);';
            // second layer: rotateFix
            let fix = document.createElement('div');
            fix.className = 'rotateFix';
            // third layer: card
            let card = document.createElement('div');
            card.className = 'card';

            fix.appendChild(card);
            container.appendChild(fix);
            otherHand.appendChild(container);
        }

        playerDiv.appendChild(head);
        playerDiv.appendChild(otherHand);

        playerContainer += playerDiv.outerHTML;
    }
    return playerContainer;
}
function createCenter(center, gameState) {
    center.innerHTML = "";
    const numOfCards = gameState.center.length;
    for (let index = 0; index < numOfCards; index++) {
        const backendCard = gameState.center[index];
        const ownerName = players[backendCard.ownerId].name;
        // create one card div
        let card = document.createElement('div');
        card.className = 'card';
        // calculate rotation to see who played the card
        const cardRotation = rotations[ownerName];
        card.style = 'position: absolute; transform: rotate(' + (cardRotation.toString()) + 'deg);';
        //card.classList.add('cardColor');
        //card.textContent = FrontendCard.toCardString(gameState.center[index]);
        card.style.backgroundImage = 'url(' + FrontendCard.toImgUrl(backendCard) + ')';

        center.appendChild(card);
    }
}

/* future chat feature
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
    }
});
socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});
*/