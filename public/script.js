const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');
const leaderbordTable = document.getElementById('leaderbordTable');

const gameDiv = document.getElementById('gameDiv');

var players = {};

document.getElementById('formName').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
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
    console.log('game started');
    socket.emit('start game');

    readyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});
socket.on('update leaderboard', (leaderBoard) => {
    leaderbordTable.innerHTML = "";
    for (let rowIndex = 0; rowIndex < leaderBoard.length; rowIndex++) {
        const rowScores = leaderBoard[rowIndex];
        const tableRow = document.createElement('tr');
        leaderbordTable.appendChild(tableRow);
        if (rowIndex == 0) {
            for (const id in players) {
                const player = players[id];
                const tableHead = document.createElement('th');
                tableHead.textContent = player.name;
                tableRow.appendChild(tableHead);
            }
        } else {
            for (const score in rowScores) {
                const tableData = document.createElement('td');
                tableData.textContent = score;
                tableRow.appendChild(tableData);
            }
        }
    }
});

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