const socket = io();

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');

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
    for(const id in players) {
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

document.getElementById('getCard').addEventListener('click', function () {
    console.log('clicked');
    socket.emit('get Card');
});
socket.on('recive Card', (card) => {
    console.log(card.toString());
    document.getElementById('getCard').innerHTML = card.toString();
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
class Card {
    constructor(number, color) {
        this.number = number;
        this.color = color;
    }
    /*
    toString(){
        return "[" + (Object.keys(WERT)).at(this.number - 1) + " " + Object.keys(FARBE).at(this.color - 1) + "]";
    }
    */
    toString() {
        switch (this.color) {
            case 1:
                switch (this.number) {
                    case 1:
                        return "🃗";
                    case 2:
                        return "🃛";
                    case 3:
                        return "🃝";
                    case 4:
                        return "🃞";
                    case 5:
                        return "🃚";
                    case 6:
                        return "🃑";
                }
                break;
            case 2:
                switch (this.number) {
                    case 1:
                        return "🂧";
                    case 2:
                        return "🂫";
                    case 3:
                        return "🂭";
                    case 4:
                        return "🂮";
                    case 5:
                        return "🂪";
                    case 6:
                        return "🂡";
                }
                break;
            case 3:
                switch (this.number) {
                    case 1:
                        return "🂷";
                    case 2:
                        return "🂻";
                    case 3:
                        return "🂽";
                    case 4:
                        return "🂾";
                    case 5:
                        return "🂺";
                    case 6:
                        return "🂱";
                }
                break;
            case 4:
                switch (this.number) {
                    case 1:
                        return "🃇";
                    case 2:
                        return "🃋";
                    case 3:
                        return "🃍";
                    case 4:
                        return "🃎";
                    case 5:
                        return "🃊";
                    case 6:
                        return "🃁";
                }
                break;
        }
    }
}
const FARBE = {
    EICHEL: 1,
    SCHIPP: 2,
    HERZ: 3,
    SCHELLEN: 4
};
const WERT = {
    SIEBEN: 1,
    UNTER: 2,
    OBER: 3,
    KOENIG: 4,
    ZEHN: 5,
    ASS: 6
};