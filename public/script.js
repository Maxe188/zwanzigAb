const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');

const gameDiv = document.getElementById('gameDiv');

const players = {};

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
    for(const id in players) {
        const player = players[id];
        const item = document.createElement('li');
        item.textContent = player.name;
        playerList.appendChild(item);
    }
});
document.getElementById('formStart').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    socket.emit('start game');
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    const leaderbord = document.getElementById('leaderbordTable');
    leaderbord.innerHTML = "";
    const row = document.createElement('tr');
    leaderbord.appendChild(row);
    for(const id in players) {
        const player = players[id];
        const item = document.createElement('th');
        item.textContent = player.name;
        row.appendChild(item);
    }
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