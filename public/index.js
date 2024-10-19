const socket = io();

const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');

nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (nameInput.value) {
    socket.emit('set name', nameInput.value);
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