const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');

document.getElementById('formName').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    socket.emit('set name', username);
    console.log('Dein Username ist: ' + username + '. Hallo ' + username + '!');
    nameDiv.style.display = 'none';
    readyDiv.style.display = 'block';
});

socket.on('update players', (players) => {
    console.log(players);
    players.forEach(player => {
        const item = document.createElement('li');
        item.textContent = player.name;
        playerList.appendChild(item);
    });
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