
// ========== MULTIPLAYER RACE UI CONTROLLER ==========
console.log('🎮 multiplayer-race.js loaded');

// ========== STATE ==========
const raceUI = {
  currentPhase: 'setup', // setup, waiting, racing, results
  raceEngine: null,
  raceStartTime: null,
  raceTimer: null
};

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ Initializing multiplayer race UI');
  
  setupEventHandlers();
  setupTheme();
  showPhase('room-setup');
});

// ========== THEME MANAGEMENT ==========
function setupTheme() {
  const themeButton = document.getElementById('theme-button');
  const themeDropdown = document.getElementById('theme-dropdown');
  let currentTheme = localStorage.getItem('theme') || 'serika-dark';

  document.body.className = `theme-${currentTheme} min-h-screen`;
  updateActiveTheme(currentTheme);

  themeButton?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    themeDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#theme-button') && !e.target.closest('#theme-dropdown')) {
      themeDropdown?.classList.add('hidden');
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
      themeDropdown?.classList.add('hidden');
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
}

// ========== EVENT HANDLERS ==========
function setupEventHandlers() {
  // Create Room
  document.getElementById('create-room-btn')?.addEventListener('click', () => {
    console.log('Creating room...');
    window.multiplayerEngine.createRoom('default', 50, (roomId, words) => {
      if (roomId) {
        console.log('✅ Room created:', roomId);
        document.getElementById('room-id-display').textContent = roomId;
        showPhase('room-waiting');
      } else {
        alert('Failed to create room. Please try again.');
      }
    });
  });

  // Join Room
  document.getElementById('join-room-btn')?.addEventListener('click', () => {
    const roomId = document.getElementById('room-id-input').value.trim().toUpperCase();
    if (!roomId) {
      alert('Please enter a room ID');
      return;
    }

    console.log('Joining room:', roomId);
    window.multiplayerEngine.joinRoom(roomId, (success, words, status) => {
      if (success) {
        console.log('✅ Joined room:', roomId);
        document.getElementById('room-id-display').textContent = roomId;
        showPhase('room-waiting');
        
        // If race already started, handle reconnect
        if (status === 'countdown' || status === 'in_progress') {
          console.log('⚠ Rejoining active race');
          // The engine listener will trigger appropriate callbacks
        }
      } else {
        alert('Failed to join room. Please check the room ID.');
      }
    });
  });

  // Copy Room ID
  document.getElementById('copy-room-btn')?.addEventListener('click', (e) => {
    const roomId = document.getElementById('room-id-display').textContent;
    navigator.clipboard.writeText(roomId).then(() => {
      const btn = e.target.closest('button');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg class="mp-btn-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>Copied!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    });
  });

  // Start Race
  document.getElementById('start-race-btn')?.addEventListener('click', () => {
    console.log('Starting race...');
    window.multiplayerEngine.initiateRace(3);
  });

  // Cancel Room
  document.getElementById('cancel-room-btn')?.addEventListener('click', () => {
    window.multiplayerEngine.disconnect();
    document.getElementById('room-id-input').value = '';
    resetWaitingUI();
    showPhase('room-setup');
  });

  // New Race
  document.getElementById('new-race-btn')?.addEventListener('click', () => {
    window.multiplayerEngine.disconnect();
    document.getElementById('room-id-input').value = '';
    resetWaitingUI();
    resetRaceUI();
    showPhase('room-setup');
  });

  // Back to Home
  document.getElementById('back-home-btn')?.addEventListener('click', () => {
    window.location.href = '/';
  });
}

// ========== PHASE MANAGEMENT ==========
function showPhase(phaseId) {
  console.log('📍 Showing phase:', phaseId);
  raceUI.currentPhase = phaseId.replace('room-', '');
  
  const phases = ['room-setup', 'room-waiting', 'room-racing', 'room-results'];
  phases.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden', id !== phaseId);
    }
  });
}

// ========== OPPONENT CONNECTED CALLBACK ==========
window.onOpponentConnected = function(opponentData) {
  console.log('✅ Opponent connected:', opponentData.displayName);
  
  document.getElementById('opponent-player-name').textContent = opponentData.displayName;
  document.getElementById('opponent-status').textContent = 'Ready';
  document.getElementById('opponent-status').classList.add('mp-status-ready');
  
  // Show start button
  document.getElementById('start-race-btn').classList.remove('hidden');
};

// ========== COUNTDOWN START CALLBACK ==========
window.onCountdownStart = function(endsAt) {
  console.log('⏱ Countdown started, ends at:', new Date(endsAt));
  showPhase('room-racing');
  
  const overlay = document.getElementById('countdown-overlay');
  overlay.classList.remove('hidden');
};

// ========== COUNTDOWN TICK CALLBACK ==========
window.onCountdownTick = function(remaining) {
  const number = document.getElementById('countdown-number');
  
  if (remaining > 0) {
    number.textContent = remaining;
    number.className = 'mp-countdown-number mp-countdown-pulse';
    setTimeout(() => {
      number.className = 'mp-countdown-number';
    }, 100);
  } else {
    number.textContent = 'GO!';
    number.className = 'mp-countdown-number mp-countdown-go';
    setTimeout(() => {
      document.getElementById('countdown-overlay').classList.add('hidden');
    }, 800);
  }
};

// ========== RACE START CALLBACK ==========
window.onRaceStart = function(data) {
  console.log('🚀 Race started with', data.totalWords, 'words');
  
  raceUI.raceStartTime = data.startedAt;
  
  // Initialize race engine
  raceUI.raceEngine = new RaceTypingEngine(data.words, data.totalWords);
  raceUI.raceEngine.init();
  
  // Start race timer
  startRaceTimer();
  
  // Focus on input
  document.getElementById('race-input')?.focus();
};

// ========== OPPONENT UPDATE CALLBACK ==========
window.onOpponentUpdate = function(opponentData) {
  const totalWords = window.multiplayerEngine.totalWords;
  const progress = (opponentData.wordsCompleted / totalWords) * 100;
  
  document.getElementById('opponent-racer-name').textContent = opponentData.displayName;
  document.getElementById('opponent-words-count').textContent = `${opponentData.wordsCompleted}/${totalWords}`;
  document.getElementById('opponent-progress-fill').style.width = `${progress}%`;
};

// ========== RACE FINISH CALLBACK ==========
window.onRaceFinish = function(results) {
  console.log('🏁 Race finished, results:', results);
  
  if (raceUI.raceTimer) {
    clearInterval(raceUI.raceTimer);
    raceUI.raceTimer = null;
  }
  
  displayResults(results);
  showPhase('room-results');
};

// ========== RACE TIMER ==========
function startRaceTimer() {
  raceUI.raceTimer = setInterval(() => {
    if (!raceUI.raceStartTime) return;
    
    const elapsed = Math.floor((Date.now() - raceUI.raceStartTime) / 1000);
    document.getElementById('race-time').textContent = elapsed + 's';
  }, 1000);
}

// ========== RESULTS DISPLAY ==========
function displayResults(results) {
  const resultsList = document.getElementById('results-list');
  let html = '';
  
  results.forEach((result) => {
    const isLocalPlayer = result.isLocalPlayer;
    const isWinner = result.rank === 1;
    
    html += `
      <div class="mp-result-card ${isLocalPlayer ? 'mp-result-local' : ''} ${isWinner ? 'mp-result-winner' : ''}">
        <div class="mp-result-rank">
          ${isWinner ? '🏆' : '#' + result.rank}
          ${result.tie ? ' (tie)' : ''}
        </div>
        <div class="mp-result-info">
          <div class="mp-result-name">
            ${result.displayName}
            ${isLocalPlayer ? '<span class="mp-result-badge">You</span>' : ''}
          </div>
          <div class="mp-result-stats">
            <span class="mp-result-stat">
              <strong>${result.wordsCompleted}</strong> words
            </span>
            <span class="mp-result-stat">
              <strong>${result.wpm}</strong> wpm
            </span>
            <span class="mp-result-stat">
              <strong>${result.accuracy}%</strong> accuracy
            </span>
            <span class="mp-result-stat">
              <strong>${result.timeElapsed}s</strong> time
            </span>
          </div>
        </div>
      </div>
    `;
  });
  
  resultsList.innerHTML = html;
}

// ========== RESET FUNCTIONS ==========
function resetWaitingUI() {
  document.getElementById('opponent-player-name').textContent = 'Waiting...';
  document.getElementById('opponent-status').textContent = 'Connecting...';
  document.getElementById('opponent-status').classList.remove('mp-status-ready');
  document.getElementById('start-race-btn').classList.add('hidden');
}

function resetRaceUI() {
  document.getElementById('local-words-count').textContent = '0/50';
  document.getElementById('opponent-words-count').textContent = '0/50';
  document.getElementById('local-progress-fill').style.width = '0%';
  document.getElementById('opponent-progress-fill').style.width = '0%';
  document.getElementById('race-wpm').textContent = '0';
  document.getElementById('race-accuracy').textContent = '100%';
  document.getElementById('race-time').textContent = '0s';
  document.getElementById('race-text-display').innerHTML = '';
  
  if (raceUI.raceTimer) {
    clearInterval(raceUI.raceTimer);
    raceUI.raceTimer = null;
  }
  
  raceUI.raceEngine = null;
  raceUI.raceStartTime = null;
}

// ========== RACE TYPING ENGINE ==========
class RaceTypingEngine {
  constructor(words, totalWords) {
    this.words = words;
    this.totalWords = totalWords;
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.input = '';
    this.correctChars = 0;
    this.incorrectChars = 0;
    this.wordsCompleted = 0;
    this.telemetryInterval = null;
  }

  init() {
    this.render();
    this.setupInput();
    this.startTelemetry();
  }

  setupInput() {
    const input = document.getElementById('race-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length > 0) {
        const lastChar = value[value.length - 1];
        this.handleInput(lastChar);
        e.target.value = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.handleBackspace();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.handleSpace();
      }
    });

    // Keep focus
    document.addEventListener('click', () => {
      if (raceUI.currentPhase === 'racing') {
        input.focus();
      }
    });
  }

  handleInput(char) {
    if (this.currentWordIndex >= this.words.length) return;

    const currentWord = this.words[this.currentWordIndex];
    this.input += char;

    if (this.currentCharIndex < currentWord.length) {
      if (char === currentWord[this.currentCharIndex]) {
        this.correctChars++;
      } else {
        this.incorrectChars++;
      }
    } else {
      this.incorrectChars++;
    }

    this.currentCharIndex++;
    this.render();
    this.updateLocalStats();
  }

  handleSpace() {
    if (this.currentWordIndex >= this.words.length - 1) {
      // Finish race
      this.finish();
      return;
    }

    this.wordsCompleted = this.currentWordIndex + 1;
    this.currentWordIndex++;
    this.currentCharIndex = 0;
    this.input = '';
    
    this.render();
    this.updateLocalStats();
  }

  handleBackspace() {
    if (this.currentCharIndex > 0) {
      const currentWord = this.words[this.currentWordIndex];
      const removedChar = this.input[this.currentCharIndex - 1];

      if (this.currentCharIndex <= currentWord.length) {
        if (removedChar === currentWord[this.currentCharIndex - 1]) {
          this.correctChars--;
        } else {
          this.incorrectChars--;
        }
      } else {
        this.incorrectChars--;
      }

      this.input = this.input.slice(0, -1);
      this.currentCharIndex--;
      this.render();
      this.updateLocalStats();
    }
  }

  render() {
    const display = document.getElementById('race-text-display');
    if (!display) return;

    let html = '';
    const wordsToShow = this.words.slice(
      Math.max(0, this.currentWordIndex - 2),
      Math.min(this.words.length, this.currentWordIndex + 10)
    );

    wordsToShow.forEach((word, idx) => {
      const actualIndex = Math.max(0, this.currentWordIndex - 2) + idx;
      const isActive = actualIndex === this.currentWordIndex;
      
      html += `<span class="mp-word ${isActive ? 'mp-word-active' : ''}">`;
      
      for (let i = 0; i < Math.max(word.length, isActive ? this.input.length : 0); i++) {
        let className = 'mp-char';
        let char = word[i] || '';
        
        if (isActive && i < this.currentCharIndex) {
          if (i < word.length && this.input[i] === word[i]) {
            className += ' mp-char-correct';
          } else {
            className += ' mp-char-incorrect';
            char = this.input[i] || char;
          }
        }
        
        html += `<span class="${className}">${char}</span>`;
      }
      
      html += '</span> ';
    });

    display.innerHTML = html;
  }

  updateLocalStats() {
    const totalChars = this.correctChars + this.incorrectChars;
    const accuracy = totalChars > 0 ? Math.round((this.correctChars / totalChars) * 100) : 100;
    
    const timeElapsed = (Date.now() - raceUI.raceStartTime) / 1000;
    const wpm = timeElapsed > 0 ? Math.round((this.correctChars / 5) / (timeElapsed / 60)) : 0;

    document.getElementById('race-wpm').textContent = wpm;
    document.getElementById('race-accuracy').textContent = accuracy + '%';
    
    const progress = (this.wordsCompleted / this.totalWords) * 100;
    document.getElementById('local-words-count').textContent = `${this.wordsCompleted}/${this.totalWords}`;
    document.getElementById('local-progress-fill').style.width = `${progress}%`;
  }

  startTelemetry() {
    this.telemetryInterval = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - raceUI.raceStartTime) / 1000);
      const totalChars = this.correctChars + this.incorrectChars;
      const accuracy = totalChars > 0 ? Math.round((this.correctChars / totalChars) * 100) : 100;
      const wpm = timeElapsed > 0 ? Math.round((this.correctChars / 5) / (timeElapsed / 60)) : 0;
      
      window.multiplayerEngine.sendTelemetry(this.wordsCompleted, wpm, accuracy, timeElapsed);
    }, 200); // Send every 200ms
  }

  finish() {
    console.log('🏁 Local player finished!');
    
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }

    const timeElapsed = Math.floor((Date.now() - raceUI.raceStartTime) / 1000);
    const totalChars = this.correctChars + this.incorrectChars;
    const accuracy = totalChars > 0 ? Math.round((this.correctChars / totalChars) * 100) : 100;
    const wpm = timeElapsed > 0 ? Math.round((this.correctChars / 5) / (timeElapsed / 60)) : 0;

    this.wordsCompleted = this.words.length;
    
    window.multiplayerEngine.finishRace(this.wordsCompleted, wpm, accuracy, timeElapsed);
  }
}