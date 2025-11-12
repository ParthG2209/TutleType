// Initialize the typing engine
let typingEngine = new TypingEngine();
typingEngine.init('time', 30);

// ========== THEME MANAGEMENT ==========
const themeButton = document.getElementById('theme-button');
const themeDropdown = document.getElementById('theme-dropdown');
const userInput = document.getElementById('user-input');
let currentTheme = localStorage.getItem('theme') || 'serika-dark';

document.body.className = `theme-${currentTheme} min-h-screen`;
updateActiveTheme(currentTheme);

themeButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    themeDropdown.classList.toggle('hidden');
    themeDropdown.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('#theme-button') && !e.target.closest('#theme-dropdown')) {
        themeDropdown.classList.add('hidden');
        themeDropdown.classList.remove('show');
    }
});

document.querySelectorAll('.theme-option').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const theme = this.getAttribute('data-theme');
        document.body.className = `theme-${theme} min-h-screen`;
        localStorage.setItem('theme', theme);
        currentTheme = theme;
        updateActiveTheme(theme);
        themeDropdown.classList.add('hidden');
        themeDropdown.classList.remove('show');
        
        // FIXED: Refocus input after theme change to prevent typing break
        setTimeout(() => {
            userInput.focus();
            typingEngine.updateCaret();
        }, 100);
    });
});

function updateActiveTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });
}

// ========== TAB MANAGEMENT ==========
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function(e) {
        const tab = this.getAttribute('data-tab');
        
        // Handle multiplayer tab - redirect to multiplayer.html
        if (tab === 'multi') {
            e.preventDefault();
            window.location.href = 'multiplayer.html';
            return;
        }
        
        // Handle other tabs (single player is default, leaderboard is disabled)
        if (tab === 'single') {
            // Already on single player page, just update active state
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        }
    });
});

// ========== MODE TYPE BUTTONS ==========
function setupModeTypeButtons() {
    document.querySelectorAll('[data-mode-type]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('[data-mode-type]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            const mode = this.getAttribute('data-mode');
            const modeValuesContainer = document.getElementById('mode-values');
            
            if (mode === 'time') {
                modeValuesContainer.innerHTML = `
                    <button class="mode-button active" data-value="15">15</button>
                    <button class="mode-button" data-value="30">30</button>
                    <button class="mode-button" data-value="60">60</button>
                    <button class="mode-button" data-value="120">120</button>
                `;
                typingEngine.init('time', 30);
            } else {
                modeValuesContainer.innerHTML = `
                    <button class="mode-button active" data-value="10">10</button>
                    <button class="mode-button" data-value="25">25</button>
                    <button class="mode-button" data-value="50">50</button>
                    <button class="mode-button" data-value="100">100</button>
                `;
                typingEngine.init('words', 25);
            }
            setupModeValueButtons();
            
            // Refocus input after mode change
            userInput.focus();
        });
    });
}

function setupModeValueButtons() {
    document.querySelectorAll('[data-value]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('[data-value]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            const value = parseInt(this.getAttribute('data-value'));
            const modeButton = document.querySelector('[data-mode-type].active');
            const mode = modeButton ? modeButton.getAttribute('data-mode') : 'time';
            typingEngine.init(mode, value);
            
            // Refocus input after value change
            userInput.focus();
        });
    });
}

setupModeTypeButtons();
setupModeValueButtons();

// ========== RESET BUTTON ==========
document.getElementById('reset-button').addEventListener('click', function(e) {
    e.preventDefault();
    const modeButton = document.querySelector('[data-mode-type].active');
    const valueButton = document.querySelector('[data-value].active');
    const mode = modeButton ? modeButton.getAttribute('data-mode') : 'time';
    const value = valueButton ? parseInt(valueButton.getAttribute('data-value')) : 30;
    typingEngine.init(mode, value);
    userInput.focus();
});

// ========== TYPING AREA FOCUS ==========
document.getElementById('typing-area').addEventListener('click', function() {
    userInput.focus();
});

window.addEventListener('load', function() {
    userInput.focus();
});

// ========== KEYBOARD INPUT ==========
userInput.addEventListener('input', function(e) {
    const value = e.target.value;
    if (value.length > 0) {
        const lastChar = value[value.length - 1];
        typingEngine.handleInput(lastChar);
        e.target.value = '';
    }
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Backspace') {
        e.preventDefault();
        typingEngine.handleBackspace();
    }
    
    if (e.key === ' ') {
        e.preventDefault();
        typingEngine.handleSpace();
    }
});

// Keep focus on input - FIXED VERSION
document.addEventListener('click', function(e) {
    // Check if clicking on a button or link - if yes, don't refocus
    if (e.target.closest('button') || e.target.closest('a')) {
        return;
    }
    
    // Only refocus input if test is active (allows redirect to work when test finishes)
    if (typingEngine.isTestActive && !typingEngine.isTestComplete) {
        userInput.focus();
    }
});

// Add focus listener to update caret when input is refocused
userInput.addEventListener('focus', function() {
    if (!typingEngine.isTestComplete) {
        typingEngine.updateCaret();
    }
});