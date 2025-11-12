let score = 0;
let timeLeft = 30;
let gameInterval;
let moleInterval;
let activeHole = null;
let isPaused = false;
let records = [];
let localRecords = JSON.parse(localStorage.getItem('whackAMoleRecords')) || [];
// Migrate old records if they are numbers
if (localRecords.length > 0 && typeof localRecords[0] === 'number') {
    localRecords = localRecords.map(score => ({ score: score, name: 'Anonimo' }));
    localStorage.setItem('whackAMoleRecords', JSON.stringify(localRecords));
}

// JSONBin configuration
const JSONBIN_BIN_ID = '6915189203998b11ea8d9246';
const JSONBIN_API_KEY = '$2a$10$hFcXan4wxOLaUeTwHYqq..haCSPKthSQzJ5PqawKa6Q9qM7oGzI.O';

// Load global records from JSONBin
async function loadGlobalRecords() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            records = data.record || [];
        } else {
            records = [];
        }
    } catch (error) {
        console.error('Errore nel caricamento dei record globali:', error);
        records = [];
    }
    // Merge with local records
    records = [...records, ...localRecords];
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, 10);
}

// Save global records to JSONBin
async function saveGlobalRecords() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify(records)
        });
        if (response.ok) {
            console.log('Record salvato globalmente.');
        } else {
            console.error('Errore nel salvataggio globale.');
        }
    } catch (error) {
        console.error('Errore nel salvataggio globale:', error);
    }
}
let level = 1;
let gridSize = 3;

const holes = document.querySelectorAll('.hole');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('level');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const message = document.getElementById('message');
const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const recordsList = document.getElementById('records-list');
const recordsUl = document.getElementById('records-ul');
const grid = document.getElementById('grid');
const nameInput = document.getElementById('name-input');
const playerNameInput = document.getElementById('player-name');
const saveRecordBtn = document.getElementById('save-record-btn');
const skipSaveBtn = document.getElementById('skip-save-btn');

document.getElementById('new-game-btn').addEventListener('click', () => {
    showGame();
    startGame();
});
document.getElementById('records-btn').addEventListener('click', showRecords);
document.getElementById('exit-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
document.getElementById('back-to-menu-btn').addEventListener('click', showMenu);
document.getElementById('back-to-menu-from-game-btn').addEventListener('click', () => {
    endGame();
    showMenu();
});

pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);
saveRecordBtn.addEventListener('click', savePlayerRecord);
skipSaveBtn.addEventListener('click', skipSave);

holes.forEach(hole => {
    hole.addEventListener('click', whackMole);
});

// Load records on page load
loadGlobalRecords();

function startGame() {
    score = 0;
    level = 1;
    gridSize = 3;
    timeLeft = 30;
    isPaused = false;
    levelDisplay.textContent = 'Livello: ' + level;
    scoreDisplay.textContent = 'Punteggio: ' + score;
    timerDisplay.textContent = 'Tempo: ' + timeLeft;
    message.textContent = '';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pausa';
    nameInput.style.display = 'none';
    updateGrid();

    gameInterval = setInterval(updateTimer, 1000);
    moleInterval = setInterval(showMole, 750);
}

function updateTimer() {
    timeLeft--;
    timerDisplay.textContent = 'Tempo: ' + timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

function showMole() {
    if (activeHole) {
        activeHole.classList.remove('active');
    }
    const visibleHoles = Array.from(holes).filter(hole => hole.style.display !== 'none');
    const randomHole = visibleHoles[Math.floor(Math.random() * visibleHoles.length)];
    randomHole.classList.add('active');
    activeHole = randomHole;
}

function whackMole() {
    if (this.classList.contains('active')) {
        score++;
        scoreDisplay.textContent = 'Punteggio: ' + score;
        this.classList.remove('active');
        activeHole = null;
        if (score >= 15 && level === 1) {
            levelUp();
        } else if (score >= 35 && level === 2) {
            levelUp();
        }
    }
}

function endGame() {
    clearInterval(gameInterval);
    clearInterval(moleInterval);
    if (activeHole) {
        activeHole.classList.remove('active');
    }
    message.textContent = 'Gioco finito! Punteggio finale: ' + score;
    pauseBtn.disabled = true;
    nameInput.style.display = 'block';
}

function saveRecord(newScore, name) {
    records.push({ score: newScore, name: name });
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, 10); // Keep top 10
    localStorage.setItem('whackAMoleRecords', JSON.stringify(records));
    saveGlobalRecords(); // Attempt to save globally
}

function showMenu() {
    menu.style.display = 'block';
    gameContainer.style.display = 'none';
    recordsList.style.display = 'none';
}

function showGame() {
    menu.style.display = 'none';
    gameContainer.style.display = 'block';
    recordsList.style.display = 'none';
}

function showRecords() {
    menu.style.display = 'none';
    gameContainer.style.display = 'none';
    recordsList.style.display = 'block';
    recordsUl.innerHTML = '';
    records.forEach((rec, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${rec.name}: ${rec.score} punti`;
        recordsUl.appendChild(li);
    });
}

function pauseGame() {
    if (!isPaused) {
        clearInterval(gameInterval);
        clearInterval(moleInterval);
        isPaused = true;
        pauseBtn.textContent = 'Riprendi';
        message.textContent = 'Gioco in pausa';
    } else {
        gameInterval = setInterval(updateTimer, 1000);
        moleInterval = setInterval(showMole, 1000);
        isPaused = false;
        pauseBtn.textContent = 'Pausa';
        message.textContent = '';
    }
}

function restartGame() {
    endGame();
    nameInput.style.display = 'none';
    startGame();
}

function savePlayerRecord() {
    const name = playerNameInput.value.trim();
    if (name) {
        saveRecord(score, name);
        playerNameInput.value = '';
        nameInput.style.display = 'none';
        message.textContent = 'Record salvato!';
        setTimeout(() => {
            message.textContent = '';
        }, 2000);
    } else {
        alert('Inserisci un nome valido.');
    }
}

function skipSave() {
    playerNameInput.value = '';
    nameInput.style.display = 'none';
}

function updateGrid() {
    if (gridSize === 3) {
        grid.className = '';
    } else if (gridSize === 4) {
        grid.className = 'grid-4x4';
    } else if (gridSize === 5) {
        grid.className = 'grid-5x5';
    }
    const allHoles = document.querySelectorAll('.hole');
    allHoles.forEach((hole, index) => {
        if (index < gridSize * gridSize) {
            hole.style.display = 'block';
        } else {
            hole.style.display = 'none';
        }
    });
}

function levelUp() {
    if (level === 1) {
        level = 2;
        gridSize = 4;
        messageText = 'Livello 2! Ora 4x4! Tempo resettato!';
    } else if (level === 2) {
        level = 3;
        gridSize = 5;
        messageText = 'Livello 3! Ora 5x5! Tempo resettato!';
    }
    timeLeft = 30; // Reset timer
    levelDisplay.textContent = 'Livello: ' + level;
    timerDisplay.textContent = 'Tempo: ' + timeLeft;
    updateGrid();
    message.textContent = messageText;
    setTimeout(() => {
        message.textContent = '';
    }, 2000);
}
