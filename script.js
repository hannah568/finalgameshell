// Game variables
let slots = [0, 1, 2];
const ballCupId = 1;
let canPick = false;
let shuffling = false;
let gameMode = 'game';

let positions = [];

// Game setup variables
let selectedLanguage = null;
let selectedPlayers = null;
let selectedDifficulty = null;

// persistence: wins, streak, total score, and language
let winsCount = parseInt(localStorage.getItem('mystic_wins') || '0', 10);
let currentStreak = parseInt(localStorage.getItem('mystic_streak') || '0', 10);
let totalScore = parseInt(localStorage.getItem('mystic_total_score') || '0', 10);
let lang = localStorage.getItem('mystic_lang') || 'en';
let aiMode = false;

// i18n strings
const i18n = {
    en: {
        startTab: 'ENTER THE MARKET', tutorial: 'Tutorial', ai: 'Game with AI', shop: 'Shop',
        startBtn: 'START GAME', playAgain: 'PLAY AGAIN', restart: 'RESTART', back: 'Back to Menu',
        watch: 'WATCH CLOSELY', pick: 'PICK A CUP', win: 'YOU WIN!', lose: 'WRONG CUP!'
    },
    zh: {
        startTab: '開始遊戲', tutorial: '教學', ai: '與 AI 遊玩', shop: '商店',
        startBtn: '開始遊戲', playAgain: '再玩一次', restart: '重新開始', back: '回主選單',
        watch: '仔細看', pick: '選一個杯子', win: '你贏了！', lose: '猜錯了！'
    }
};

// DOM elements
const gameArea = document.getElementById("game-area");
const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const difficultySel = document.getElementById("difficulty");
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const menuTabs = document.querySelectorAll(".menu-tab");
const backBtn = document.getElementById("back-btn");

// Shop elements
const shopPanel = document.getElementById('shop-panel');
const cupColor = document.getElementById('cupColor');
const cupStyle = document.getElementById('cupStyle');
const ballColor = document.getElementById('ballColor');
const ballType = document.getElementById('ballType');
const tableStyle = document.getElementById('tableStyle');
const bgStyle = document.getElementById('bgStyle');
const applyShop = document.getElementById('applyShop');
const resetShop = document.getElementById('resetShop');
const languageSel = document.getElementById('languageSel');
const tutorialPanel = document.getElementById('tutorial-panel');
const tutorialEn = document.getElementById('tutorial-en');
const tutorialZh = document.getElementById('tutorial-zh');

// Score display elements
const totalScoreDisplay = document.getElementById('total-score');
const scorePanel = document.getElementById('score-panel');

function updateScoreDisplay() {
    totalScoreDisplay.textContent = totalScore.toString().padStart(4, '0');
    // hide score panel if score is 0
    if (totalScore === 0) {
        scorePanel.style.opacity = '0';
        scorePanel.style.pointerEvents = 'none';
    } else {
        scorePanel.style.opacity = '1';
        scorePanel.style.pointerEvents = 'auto';
    }
}

menuTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        menuTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        gameMode = tab.dataset.mode;

        if (gameMode === 'game') {
            shopPanel.classList.add('hidden');
            menuScreen.classList.add("hidden");
            gameScreen.classList.add("active");
            initGame();
            return;
        }

        if (gameMode === 'shop') {
            // show shop inside the menu
            shopPanel.classList.remove('hidden');
            tutorialPanel.classList.add('hidden');
            menuScreen.classList.remove('hidden');
            gameScreen.classList.remove('active');
            return;
        }

        if (gameMode === 'settings') {
            // show settings controls (language) in menu
            shopPanel.classList.add('hidden');
            tutorialPanel.classList.add('hidden');
            menuScreen.classList.remove('hidden');
            gameScreen.classList.remove('active');
            if (languageSel) languageSel.focus();
            return;
        }

        if (gameMode === 'tutorial') {
            tutorialPanel.classList.remove('hidden');
            shopPanel.classList.add('hidden');
            menuScreen.classList.remove('hidden');
            gameScreen.classList.remove('active');
            // show correct language inside tutorial
            if (tutorialEn && tutorialZh) {
                if (lang === 'zh') { tutorialEn.style.display = 'none'; tutorialZh.style.display = ''; }
                else { tutorialEn.style.display = ''; tutorialZh.style.display = 'none'; }
            }
            return;
        }

        if (gameMode === 'ai') {
            // start an AI match: show game and let AI play
            shopPanel.classList.add('hidden');
            tutorialPanel.classList.add('hidden');
            menuScreen.classList.add('hidden');
            gameScreen.classList.add('active');
            startAIMatch();
            return;
        }

        // fallback for other tabs (tutorial/shop handled above): keep menu visible and hide panels
        shopPanel.classList.add('hidden');
        tutorialPanel.classList.add('hidden');
        menuScreen.classList.remove('hidden');
        gameScreen.classList.remove('active');
    });
});

// set initial language selections and UI
function setLanguage(to) {
    lang = to;
    localStorage.setItem('mystic_lang', lang);
    const t = i18n[lang] || i18n.en;
    // update menu tab texts (in order)
    const tabs = document.querySelectorAll('.menu-tab');
    const langNames = { en: 'ENGLISH', zh: '中文' };
    if (tabs[0]) tabs[0].textContent = t.startTab;
    if (tabs[1]) tabs[1].textContent = `SETTINGS: ${langNames[lang] || lang.toUpperCase()}`;
    if (tabs[2]) tabs[2].textContent = t.ai;
    if (tabs[3]) tabs[3].textContent = t.shop;
    // controls
    startBtn.textContent = t.startBtn;
    backBtn.textContent = t.back;
    // status text reset
    status.textContent = '';
    // tutorial language toggle
    if (tutorialEn && tutorialZh) {
        if (lang === 'zh') { tutorialEn.style.display = 'none'; tutorialZh.style.display = ''; }
        else { tutorialEn.style.display = ''; tutorialZh.style.display = 'none'; }
    }
}

languageSel.value = lang;
languageSel.addEventListener('change', (e) => setLanguage(e.target.value));
setLanguage(lang);

// Back to menu
backBtn.addEventListener("click", () => {
    menuScreen.classList.remove("hidden");
    gameScreen.classList.remove("active");
    gameArea.innerHTML = "";
});

/**
 * Initialize the game by creating three cups
 */
function initGame() {
    gameArea.innerHTML = "";
    slots = [0, 1, 2];
    canPick = false;
    status.textContent = "";
    startBtn.style.display = "inline-block";
    startBtn.textContent = i18n[lang].startBtn;
    // create cups first so we can measure sizes and center them
    slots.forEach((id) => {
        const cup = document.createElement("div");
        cup.className = "cup";
        cup.id = "cup-" + id;
        cup.style.position = 'absolute';
        cup.style.bottom = '18px';

        if (id === ballCupId) {
            const ball = document.createElement("div");
            ball.className = "ball";
            ball.style.display = "none";
            cup.appendChild(ball);
        }

        cup.onclick = () => pickCup(id);
        gameArea.appendChild(cup);
    });

    // compute centered positions based on actual cup width and container
    const firstCup = gameArea.querySelector('.cup');
    const cupW = firstCup ? firstCup.offsetWidth : 120;
    const gap = Math.round(cupW * 0.25);
    const totalWidth = cupW * 3 + gap * 2;
    const startX = Math.max(12, Math.round((gameArea.clientWidth - totalWidth) / 2));
    positions = [startX, startX + cupW + gap, startX + (cupW + gap) * 2];

    // apply computed positions
    slots.forEach((id, i) => {
        const c = document.getElementById('cup-' + id);
        if (c) c.style.left = positions[i] + 'px';
    });
}

/**
 * Shuffle the cups based on difficulty
 */
async function shuffle() {
    if (shuffling) return;
    shuffling = true;
    startBtn.style.display = "none";
    status.textContent = i18n[lang].watch;

    // Adjust shuffle strength and speed by difficulty
    const diff = difficultySel ? difficultySel.value : 'medium';
    let rounds = 6, delay = 400;
    if (diff === 'easy') { rounds = 4; delay = 700; }
    else if (diff === 'medium') { rounds = 6; delay = 420; }
    else if (diff === 'hard') { rounds = 10; delay = 220; }
    else if (diff === 'adaptive') {
        // Adaptive: start easier and scale with player's wins
        const extraRounds = Math.floor(winsCount / 2); // every 2 wins adds a round
        rounds = Math.min(12, 4 + extraRounds);
        // speed up as player wins more (decrease delay), clamp to 180ms
        delay = Math.max(180, 700 - winsCount * 28);
    }

    for (let i = 0; i < rounds; i++) {
        let a = Math.floor(Math.random() * 3);
        let b = Math.floor(Math.random() * 3);
        while (a === b) b = Math.floor(Math.random() * 3);

        [slots[a], slots[b]] = [slots[b], slots[a]];
        // update left positions for each cup to animate movement
        slots.forEach((id, index) => {
            const c = document.getElementById('cup-' + id);
            if (!c) return;
            // apply subtle shuffling state (no rotation)
            c.classList.add('shuffling');
            c.style.left = positions[index] + 'px';
        });

        await new Promise(r => setTimeout(r, delay));
    }

    status.textContent = i18n[lang].pick;
    canPick = true;
    shuffling = false;
    // stop shuffling visual state
    document.querySelectorAll('.cup').forEach(c => c.classList.remove('shuffling'));
}

/**
 * Handle cup selection and reveal the ball
 * @param {number} id - The cup ID that was picked
 */
function pickCup(id) {
    if (!canPick) return;
    canPick = false;

    const picked = document.getElementById('cup-' + id);
    // lift only the chosen cup immediately
    picked.classList.add('lift');

    // reveal ball under the picked cup if present
    const pickedBall = picked.querySelector('.ball');
    if (pickedBall) {
        pickedBall.style.display = 'block';
    }

    // if picked wrong, reveal the true cup after a short delay
    if (id !== ballCupId) {
        setTimeout(() => {
            const trueCup = document.querySelector('.cup .ball')?.parentElement;
            if (trueCup) {
                trueCup.classList.add('lift');
                const trueBall = trueCup.querySelector('.ball');
                if (trueBall) trueBall.style.display = 'block';
            }
            status.textContent = i18n[lang].lose;
            // reset streak on loss
            currentStreak = 0;
            localStorage.setItem('mystic_streak', '0');
            updateScoreDisplay();
            // show Restart button so player can restart after a loss
            startBtn.textContent = i18n[lang].restart || 'RESTART';
            startBtn.style.display = 'inline-block';
        }, 700);
    } else {
        status.textContent = i18n[lang].win;
        // increment wins, streak, and score
        winsCount = (winsCount || 0) + 1;
        currentStreak = (currentStreak || 0) + 1;
        totalScore = (totalScore || 0) + (10 * currentStreak);
        // persist
        localStorage.setItem('mystic_wins', winsCount.toString());
        localStorage.setItem('mystic_streak', currentStreak.toString());
        localStorage.setItem('mystic_total_score', totalScore.toString());
        updateScoreDisplay();

        // automatically start the next round after a short pause
        // do not show a "play again" button when player wins
        setTimeout(() => {
            // start next round only if game screen still active
            if (gameScreen.classList.contains('active')) {
                startNextRound();
            }
        }, 900);
    }
}

// startNextRound: asynchronously begins a new round (preview + shuffle)
async function startNextRound() {
    // reset cups and UI immediately
    initGame();
    // small delay so player registers the win
    await previewBall(700);
    await shuffle();
}

// Utility: preview ball briefly before shuffling
function previewBall(duration = 900) {
    const ball = document.getElementById('cup-' + ballCupId)?.querySelector('.ball');
    if (!ball) return Promise.resolve();
    ball.style.display = 'block';
    return new Promise(res => setTimeout(() => { ball.style.display = 'none'; res(); }, duration));
}

// Start button click handler — show preview then shuffle
startBtn.onclick = async () => {
    // user-initiated match: ensure AI mode is off
    aiMode = false;
    initGame();
    await previewBall(800);
    await shuffle();
};

// Start a match where AI picks automatically
async function startAIMatch() {
    aiMode = true;
    initGame();
    await previewBall(600);
    await shuffle();
    // small delay so UI updates
    await new Promise(r => setTimeout(r, 500));
    aiPick();
}

function aiPick() {
    // AI picks based on difficulty (higher difficulty -> more likely to pick correctly)
    const diff = difficultySel ? difficultySel.value : 'medium';
    let correctChance = 0.6;
    if (diff === 'easy') correctChance = 0.45;
    else if (diff === 'hard') correctChance = 0.75;

    const pickCorrect = Math.random() < correctChance;
    let choice;
    if (pickCorrect) choice = ballCupId;
    else {
        const others = [0,1,2].filter(i => i !== ballCupId);
        choice = others[Math.floor(Math.random()*others.length)];
    }
    // Slight delay to mimic thinking
    setTimeout(() => pickCup(choice), 700 + Math.floor(Math.random()*600));
}

// Initialize UI state on page load (defer creating cups until game start)
updateScoreDisplay();

// Shop apply/reset handlers
function applyShopSettings() {
    // cup gradient: custom color gradient based on chosen color
    const c = cupColor.value;
    let cupGradient;
    if (cupStyle.value === 'matte') {
        cupGradient = c;
    } else if (cupStyle.value === 'striped') {
        cupGradient = `repeating-linear-gradient(135deg, ${c}, ${c} 8px, rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 16px)`;
    } else {
        // gradient style
        const darkC = adjustColor(c, -30);
        cupGradient = `linear-gradient(135deg, ${c} 0%, ${c} 40%, ${darkC} 100%)`;
    }

    // ball gradient
    const b = ballColor.value;
    const ballGrad = ballType.value === 'matte' ? b : `radial-gradient(circle at 28% 28%, ${b}, ${adjustColor(b, 20)})`;

    // table styles
    let tableGrad = '';
    if (tableStyle.value === 'wood') tableGrad = 'linear-gradient(180deg, #2b1509 0%, #3b2313 40%, #28160a 100%)';
    else if (tableStyle.value === 'cloth') tableGrad = 'linear-gradient(180deg,#2b1b2b,#3a2536)';
    else tableGrad = 'linear-gradient(180deg,#101218,#1b2430)';

    // background quick themes
    if (bgStyle.value === 'market') {
        document.body.style.background = 'radial-gradient(ellipse at 20% 10%, rgba(255,180,100,0.03) 0%, transparent 20%), radial-gradient(ellipse at 80% 30%, rgba(255,80,120,0.03) 0%, transparent 15%), linear-gradient(180deg, #050515 0%, #08102a 70%)';
    } else if (bgStyle.value === 'neon') {
        document.body.style.background = 'linear-gradient(180deg,#0f0326,#12042a)';
    } else {
        document.body.style.background = '';
    }

    // apply CSS variables
    document.documentElement.style.setProperty('--cup-gradient', cupGradient);
    document.documentElement.style.setProperty('--ball-gradient', ballGrad);
    document.documentElement.style.setProperty('--ball-color', b);
    document.documentElement.style.setProperty('--table-gradient', tableGrad);

    // re-init to apply new visuals
    initGame();
}

function adjustColor(hex, percent) {
    // simple hex color darkening
    const num = parseInt(hex.replace('#',''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) + amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) + amt);
    const B = Math.max(0, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
      (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
      .toString(16).slice(1);
}

function resetShopSettings() {
    document.documentElement.style.removeProperty('--cup-gradient');
    document.documentElement.style.removeProperty('--ball-gradient');
    document.documentElement.style.removeProperty('--ball-color');
    document.documentElement.style.removeProperty('--table-gradient');
    document.body.style.background = '';
    cupColor.value = '#2a5f7a';
    cupStyle.value = 'gradient';
    ballColor.value = '#fff6c8';
    ballType.value = 'gloss';
    tableStyle.value = 'wood';
    bgStyle.value = 'market';
    initGame();
}

if (applyShop) applyShop.addEventListener('click', applyShopSettings);
if (resetShop) resetShop.addEventListener('click', resetShopSettings);

// ===== NEW GAME FLOW: Splash -> Language -> Players -> Difficulty -> Game =====

const splashScreen = document.getElementById('splash-screen');
const languageScreen = document.getElementById('language-screen');
const playerScreen = document.getElementById('player-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const enterBtn = document.getElementById('enter-btn');

// Splash Screen -> Language Screen
if (enterBtn) {
    enterBtn.addEventListener('click', () => {
        splashScreen.classList.add('hidden');
        languageScreen.classList.add('active');
    });
}

// Language Selection
const langButtons = document.querySelectorAll('#language-screen .selection-btn');
const langContinueBtn = document.getElementById('lang-continue-btn');

langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLanguage = btn.dataset.lang;
        langContinueBtn.disabled = false;
    });
});

langContinueBtn.addEventListener('click', () => {
    if (selectedLanguage) {
        lang = selectedLanguage;
        localStorage.setItem('mystic_lang', lang);
        setLanguage(lang);
        languageScreen.classList.remove('active');
        playerScreen.classList.add('active');
    }
});

// Player Selection
const playerButtons = document.querySelectorAll('#player-screen .selection-btn');
const playerContinueBtn = document.getElementById('player-continue-btn');

playerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPlayers = btn.dataset.players;
        playerContinueBtn.disabled = false;
    });
});

playerContinueBtn.addEventListener('click', () => {
    if (selectedPlayers) {
        playerScreen.classList.remove('active');
        difficultyScreen.classList.add('active');
    }
});

// Difficulty Selection
const difficultyButtons = document.querySelectorAll('#difficulty-screen .selection-btn');
const difficultyContinueBtn = document.getElementById('difficulty-continue-btn');

difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDifficulty = btn.dataset.difficulty;
        difficultyContinueBtn.disabled = false;
    });
});

difficultyContinueBtn.addEventListener('click', () => {
    if (selectedDifficulty) {
        // Set difficulty
        if (difficultySel) {
            difficultySel.value = selectedDifficulty;
        }
        
        // Start the game
        difficultyScreen.classList.remove('active');
        menuScreen.classList.add('hidden');
        gameScreen.classList.add('active');
        initGame();
        
        // Auto-start the game after a brief moment
        setTimeout(() => {
            shuffle();
        }, 500);
    }
});
