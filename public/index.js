const socket = io();

const startDiv = document.getElementById('startDiv');
const nameSubmitBtn = document.getElementById('nameSubmitBtn');
const nameInput = document.getElementById('nameInput');

nameSubmitBtn.addEventListener('click', () => {
    if (nameInput.value) {
        socket.emit('set name', nameInput.value);
        startDiv.style.display = 'none';
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