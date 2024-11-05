const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');
const leaderbordTable = document.getElementById('leaderbordTable');
const usernameInput = document.getElementById('username');
const ownHandDiv = document.getElementById('myself');

const gameDiv = document.getElementById('gameDiv');

var players = {};

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
            for (const id in players) {
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
    // popup button for dealing three. If button pressed ->
    socket.emit('start dealing three');
});

socket.on('update gameState', (gameState) => {
    console.log(gameState);
    ownHandDiv.innerHTML = createOwnHand(gameState);
});
function createOwnHand(gameState){
    hand = "";
    const numOfCards = gameState.ownHand.length;
    const degOfTilt = 30;
    for (let index = 0; index < numOfCards; index++) {
        let card = document.createElement('div');
        card.className = 'card hand';
        card.textContent = FrontendCard.toCardString(gameState.ownHand[index]);
        card.style.rotate = (degOfTilt / (numOfCards - 1) * index - (degOfTilt/2)).toString() + 'deg';
        hand += card.outerHTML;
    }
    return hand;
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