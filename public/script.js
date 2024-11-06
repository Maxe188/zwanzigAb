const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');
const leaderbordTable = document.getElementById('leaderbordTable');
const usernameInput = document.getElementById('username');
const ownHandDiv = document.getElementById('myself');
const othersDiv = document.getElementById('others');

const gameDiv = document.getElementById('gameDiv');

var players = {};

var awaitDealing = false;
var choosingTrumpf = false;

socket.on('name suggestion', (suggestedName) => {
    console.log('name suggestion: ' + suggestedName);
    usernameInput.value = suggestedName;
});

document.getElementById('formName').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = usernameInput.value;
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
    socket.emit('starting game');
});
socket.on('start game', () => {
    console.log('game started');
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});
socket.on('game ended', () => {
    console.log('game stoped');
    gameDiv.style.display = 'none';
});
socket.on('update leaderboard', (leaderBoard) => {
    console.log(leaderBoard);
    leaderbordTable.innerHTML = "";
    for (let rowIndex = 0; rowIndex <= Object.keys(leaderBoard).length; rowIndex++) {
        const tableRow = document.createElement('tr');
        if (rowIndex == 0) {
            for (const id in players) { // for in is unorderd
                const player = players[id];
                const tableHead = document.createElement('th');
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

socket.on('deal three', () => {
    console.log('simulate deal btn pressed');
    awaitDealing = true;
    // popup button for dealing three. If button pressed ->
    socket.emit('start dealing three');
});
socket.on('choose trumpf', () => {
    console.log('choose trumpf');
    choosingTrumpf = true;
    document.getElementById('trumpfMessage').style.display = 'flex';
});
function cardClicked(clickedCard){
    if(choosingTrumpf) {
        choosingTrumpf = false;
        document.getElementById('trumpfMessage').style.display = 'none';
        socket.emit('set trumpf', 1); // index of clickedCard
    }
}

socket.on('update gameState', (gameState) => {
    console.log(gameState);
    ownHandDiv.innerHTML = createOwnHand(gameState);
    othersDiv.innerHTML = createOtherPlayers(gameState);
});
function createOwnHand(gameState){
    hand = "";
    const numOfCards = gameState.ownHand.length;
    const degOfTilt = 8.5;
    for (let index = 0; index < numOfCards; index++) {
        // first layer: rotatingContainer
        let container = document.createElement('div');
        container.className = 'rotatingContainer';
        const tilt = degOfTilt * index - (degOfTilt * (numOfCards - 1) /2) + 90;
        container.style = 'transform: rotate(' + (tilt.toString()) + 'deg);';
        // second layer: hoverAndRotateFix
        let fix = document.createElement('div');
        fix.className = 'hoverAndRotateFix';
        // third layer: card hand
        let card = document.createElement('div');
        card.className = 'card handCard';
        card.textContent = FrontendCard.toCardString(gameState.ownHand[index]);


        fix.appendChild(card);
        container.appendChild(fix);
        
        hand += container.outerHTML;
    }
    return hand;
}
function createOtherPlayers(gameState){
    playerContainer = "";
    const numOfOtherPlayers = Object.keys(gameState.otherPlayers).length;
    const degOfRotation = 360 / (numOfOtherPlayers + 1);
    for (let playerI = 0; playerI < numOfOtherPlayers; playerI++) {
        const playerName = Object.keys(gameState.otherPlayers)[playerI];
        const otherPlayer = gameState.otherPlayers[playerName];
        const numOfCards = otherPlayer.handCount;
        const numOfStiche = otherPlayer.stichCount;
        // first layer: playerDiv
        let playerDiv = document.createElement('div');
        playerDiv.className = 'otherPlayer';
        const rotation = degOfRotation * (playerI + 1);
        playerDiv.style = 'transform: rotate(' + (rotation.toString()) + 'deg) translate(-300px) rotate(90deg) scale(0.8);';
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
            const tilt = degOfTilt * index - (degOfTilt * (numOfCards - 1) /2) + 90;
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
    return playerContainer.outerHTML;
}

document.getElementById('getCard').addEventListener('click', function () {
    console.log('clicked');
    socket.emit('get Card');
});
socket.on('recive Card', (card) => {
    console.log(FrontendCard.toAscii(card));
    document.getElementById('ablageCard').style.backgroundImage = 'url(' + FrontendCard.toImgUrl(card) + ')';
    document.getElementById('getCard').innerHTML = FrontendCard.toAscii(card);
});

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