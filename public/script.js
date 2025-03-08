const socket = io({
    autoConnect: false
});

const nameDiv = document.getElementById('nameDiv');

const readyDiv = document.getElementById('readyDiv');
const playerList = document.getElementById('readyList');
const leaderbordTable = document.getElementById('leaderbordTable');
const usernameInput = document.getElementById('username');
const ownHandDiv = document.getElementById('myself');
const othersDiv = document.getElementById('others');
const centerDiv = document.getElementById('center');
const outButton = document.getElementById('outButton');
const leaveButton = document.getElementById('leaveButton');
const goText = document.createElement('h1');
goText.textContent = 'Los gehts!!!';

const gameDiv = document.getElementById('gameDiv');

var players = {};
var username = "";
var lastGameState = {};

var choosingTrumpf = false;
var tradeing = false;
var playing = false;

var debugGame = false;

var selectedTradingCards = [];
var lastHand;
const rotations = {};

// handle IDs
const sessionID = sessionStorage.getItem("sessionID");
if (sessionID) socket.auth = { sessionID };
socket.connect();

socket.on("session", ({ sessionID, userID }) => {
    // attach the session ID to the next reconnection attempts
    socket.auth = { sessionID };
    // store it in the sessionStorage
    sessionStorage.setItem("sessionID", sessionID); // future? may be changed to local storage to only be able to play one game
    // save the ID of the user
    socket.userID = userID;
});

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
leaveButton.onclick = () => {
    if(confirm('Spiel wirklich verlassen?\nEs wird für alle beendet!'))  socket.emit('leave game');
};

socket.on('game ended', () => {
    console.log('game stoped');
    // reset
    nameDiv.style.display = 'block';
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'none';
    document.getElementById('dealThreeMessage').style.display = 'none';
    document.getElementById('trumpfMessage').style.display = 'none';
    document.getElementById('dealTwoMessage').style.display = 'none';
    document.getElementById('tradeMessage').style.display = 'none';

    players = {};
    username = "";
    lastGameState = {};
    choosingTrumpf = false;
    tradeing = false;
    playing = false;
    debugGame = false;
    selectedTradingCards = [];

    alert('Spiel angehalten.');
});
socket.on('update leaderboard', (leaderBoard) => {
    console.log(leaderBoard);
    leaderbordTable.innerHTML = "";
    for (let rowIndex = 0; rowIndex < Object.keys(leaderBoard).length; rowIndex++) {
        const tableRow = document.createElement('tr');
        if (rowIndex == 0) {
            const names = leaderBoard[rowIndex];
            for (let nameIndex = 0; nameIndex < Object.keys(names).length; nameIndex++) {
                const name = names[nameIndex];
                const tableHead = document.createElement('th');
                if (name === username) tableHead.style.backgroundColor = 'rgba(200,80,80,1)';
                tableHead.textContent = name;
                tableRow.appendChild(tableHead);
            }
        } else {
            const rowScores = leaderBoard[rowIndex];
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
    showTrumpf(trumpfColor);
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
    let clickedIndex = parseInt(element.classList[0]);
    if (choosingTrumpf) {
        choosingTrumpf = false;
        document.getElementById('trumpfMessage').style.display = 'none';
        socket.emit('set trumpf', clickedIndex);
        console.log('index of chosen card: ' + clickedIndex);
    } else if (tradeing) {
        element.classList.toggle('selected');
        selectedTradingCards.includes(clickedIndex) ? selectedTradingCards.splice(selectedTradingCards.indexOf(clickedIndex), 1) : selectedTradingCards.push(clickedIndex);
        console.log('toggled ' + clickedIndex + '. card');
    } else if (playing) {
        socket.emit('play card', clickedIndex);
        console.log('played card: ' + element.innerHTML);
    } else {
        console.log('clicked on card and nothing happened');
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

    if(lastGameState.currentPlayerName === username || Object.keys(lastGameState.otherPlayers).length <= 2) outButton.style.display = 'none';
    else outButton.style.display = 'inline-block';

    document.getElementById('tradeMessage').style.display = 'flex';
});
document.getElementById('tradeButton').onclick = () => {
    tradeing = false;
    document.getElementById('tradeMessage').style.display = 'none';
    console.log('trade cards: ' + selectedTradingCards)
    socket.emit('enterTrade', selectedTradingCards);
}
outButton.onclick = () => {
    for(const playerName in lastGameState.otherPlayers){
        if (lastGameState.otherPlayers[playerName].handCount === 0 && username != playerName && lastGameState.currentPlayerName != playerName) {
            alert('Du musst leider mitspielen!');
            return;
        }
    }
    if(lastGameState.dealingPlayerName === username && !(Object.entries(lastGameState.otherPlayers).every((pair) => (pair[1] === 'you' || pair[1].traded || pair[0] === lastGameState.currentPlayerName)))){ // wenn du austeilender bist, und nicht alle vor dir getauscht haben(angenommen du hast getauscht), dann darfst du nicht raus gehen. Außnahme Trumpfspielen, weil er mitspielen muss
        alert('Es haben nicht alle getauscht!');
        return;
    }

    tradeing = false;
    document.getElementById('tradeMessage').style.display = 'none';
    console.log('you\'re out');
    socket.emit('not participating');
}
socket.on('lets go', () => {
    playing = true;
    centerDiv.innerHTML = '';
    centerDiv.appendChild(goText);
});
socket.on('not valid card', (cardIndex) => {
    const cardDiv = ownHandDiv.children[cardIndex].firstChild.firstChild;
    cardDiv.classList.add('notValid');
    setTimeout(() => { cardDiv.classList.remove('notValid') }, 1000);
});
socket.on('won', () => {
    playing = false;
    console.log('won');
    alert('Du hast gewonnen!\nGlückwunsch!');
});
socket.on('lost', () => {
    playing = false;
    console.log('lost');
    alert('Du hast leider dieses mal verloren!');
});

socket.on('update gameState', (backendGameState) => {
    console.log(backendGameState);
    lastGameState = backendGameState;
    username = backendGameState.yourName;
    debugGame = backendGameState.debugGame;
    createOwnHand(ownHandDiv, backendGameState);
    othersDiv.innerHTML = createOtherPlayers(backendGameState);
    createCenter(centerDiv, backendGameState);
    setState(backendGameState.state, backendGameState);
    showTrumpf(backendGameState.trumpfColor);
    currentPlayerColor(backendGameState);
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
        card.style = 'position: absolute; transform: rotate(' + (cardRotation.toString()) + 'deg)  translate(0, 35px);';
        //card.classList.add('cardColor');
        //card.textContent = FrontendCard.toCardString(gameState.center[index]);
        card.style.backgroundImage = 'url(' + FrontendCard.toImgUrl(backendCard) + ')';

        center.appendChild(card);
    }
}
function setState(state, gameState){
    // hide everything
    nameDiv.style.display = 'none';
    readyDiv.style.display = 'none';
    gameDiv.style.display = 'none';
    document.getElementById('dealThreeMessage').style.display = 'none';
    document.getElementById('trumpfMessage').style.display = 'none';
    document.getElementById('dealTwoMessage').style.display = 'none';
    document.getElementById('tradeMessage').style.display = 'none';
    // show what is needed and set needed variables
    switch(state){
        case 1:
            gameDiv.style.display = 'block';
            if(gameState.dealingPlayerName != username) return;
            document.getElementById('dealTwoMessage').style.display = 'flex';
            break;
        case 2:
            gameDiv.style.display = 'block';
            if(gameState.currentPlayerName != username) return;
            console.log('currently coosing trumpf: ' + gameState.currentPlayerName + ' you: ' + username);
            choosingTrumpf = true;
            document.getElementById('trumpfMessage').style.display = 'flex';
            break;
        case 3:
            gameDiv.style.display = 'block';
            if(gameState.youTraded) return;
            tradeing = true;
            document.getElementById('tradeMessage').style.display = 'flex';
            if(gameState.currentPlayerName === username || Object.keys(gameState.otherPlayers).length === 2) outButton.style.display = 'none';
            else outButton.style.display = 'inline-block';
            break;
        case 4:
            gameDiv.style.display = 'block';
            playing = true;
            if (centerDiv.innerHTML === "") centerDiv.appendChild(goText);
            break;
        case 5:
            gameDiv.style.display = 'block';
            if(gameState.dealingPlayerName != username) return;
            document.getElementById('dealThreeMessage').style.display = 'flex';
            break;
        case 6:
            readyDiv.style.display = 'block';
            break;
        default:
            nameDiv.style.display = 'block';
            break;
    }
}
function currentPlayerColor(gameState){
    const firstRow = leaderbordTable.children[0].children;
    for (let nameIndex = 0; nameIndex < firstRow.length; nameIndex++) {
        if(firstRow[nameIndex].textContent === gameState.currentPlayerName) firstRow[nameIndex].style.color = 'rgba(9, 57, 177, 0.82)';
        else firstRow[nameIndex].style.color = 'rgb(0, 0, 0)';
    }
}

function showTrumpf(trumpfColor) {
    document.getElementById('theTrumpfDisplay').style.backgroundImage = 'url(' + FrontendCard.colorUrl(trumpfColor) + ')';
}

socket.onAny((eventName, ...args) => {
  //console.log("unknown event: " + eventName);
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