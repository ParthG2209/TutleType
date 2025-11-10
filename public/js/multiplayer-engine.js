// ========== DIAGNOSTIC LOGGING ==========
console.log('🟢 multiplayer-engine.js loaded');

// ========== FIREBASE CONFIGURATION ==========
let app, db;
let firebaseReady = false;

const firebaseConfig = {
  apiKey: "AIzaSyB8W9yY_T5r-gU2iZSFRGo3x3lv95Ldoao",
  authDomain: "tutletype.firebaseapp.com",
  databaseURL: "https://tutletype-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tutletype",
  storageBucket: "tutletype.firebasestorage.app",
  messagingSenderId: "576421686799",
  appId: "1:576421686799:web:29411c65938e55b7643d7a",
  measurementId: "G-VRR26Z9PKZ"
};

// ========== MULTIPLAYER ENGINE CLASS ==========
class MultiplayerEngine {
  constructor() {
    this.roomId = null;
    this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
    this.opponentId = null;
    this.isHost = false;
    this.roomRef = null;
    this.listeners = [];
    this.isConnected = false;
    console.log('✓ MultiplayerEngine instance created, playerId:', this.playerId);
  }

  createRoom(callback) {
    console.log('📝 createRoom() method called');
    console.log('db exists?', !!db);
    console.log('firebaseReady?', firebaseReady);

    if (!db) {
      console.error('❌ Database not initialized');
      alert('Firebase not ready. Please refresh the page.');
      if (callback) callback(null);
      return null;
    }

    this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.isHost = true;
    console.log('✓ Room ID generated:', this.roomId);

    const roomData = {
      host: this.playerId,
      created: firebase.database.ServerValue.TIMESTAMP,
      status: 'waiting',
      players: {}
    };

    roomData.players[this.playerId] = {
      status: 'ready',
      role: 'host',
      wpm: 0,
      accuracy: 100,
      progress: 0
    };

    console.log('📤 Attempting Firebase write to:', 'rooms/' + this.roomId);
    console.log('Data:', roomData);

    db.ref('rooms/' + this.roomId).set(roomData)
      .then(() => {
        console.log('✅✅✅ Firebase write SUCCESS!');
        this.setupRoomListener();
        if (callback) callback(this.roomId);
      })
      .catch(err => {
        console.error('❌❌❌ Firebase write FAILED:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        alert('Failed to create room: ' + err.message);
        if (callback) callback(null);
      });

    return this.roomId;
  }

  joinRoom(roomId, callback) {
    console.log('📝 Joining room:', roomId);

    if (!db) {
      alert('Firebase not ready');
      if (callback) callback(false);
      return;
    }

    this.roomId = roomId;
    this.isHost = false;

    db.ref('rooms/' + roomId).once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          const playerData = {
            status: 'ready',
            role: 'guest',
            wpm: 0,
            accuracy: 100,
            progress: 0
          };
          return db.ref('rooms/' + roomId + '/players/' + this.playerId).set(playerData);
        } else {
          throw new Error('Room does not exist');
        }
      })
      .then(() => {
        console.log('✓ Joined room successfully');
        this.setupRoomListener();
        if (callback) callback(true);
      })
      .catch(err => {
        console.error('❌ Error joining room:', err);
        alert('Failed to join: ' + err.message);
        if (callback) callback(false);
      });
  }

  setupRoomListener() {
    if (!db || !this.roomId) return;

    this.roomRef = db.ref('rooms/' + this.roomId + '/players');

    this.roomRef.on('value', (snapshot) => {
      const players = snapshot.val();
      if (players) {
        const playerIds = Object.keys(players);
        console.log('👥 Players in room:', playerIds.length);

        const opponent = playerIds.find(id => id !== this.playerId);

        if (opponent && !this.isConnected) {
          this.opponentId = opponent;
          this.isConnected = true;
          console.log('✓✓✓ OPPONENT CONNECTED!');

          if (window.onOpponentConnected) {
            window.onOpponentConnected();
          }
        }

        if (opponent && window.onOpponentStatsUpdate) {
          window.onOpponentStatsUpdate(players[opponent]);
        }
      }
    });
  }

  sendStats(stats) {
    if (db && this.roomId && this.playerId) {
      db.ref('rooms/' + this.roomId + '/players/' + this.playerId).update({
        wpm: stats.wpm || 0,
        accuracy: stats.accuracy || 100,
        progress: stats.progress || 0,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }).catch(err => {
        console.error('Error updating stats:', err);
      });
    }
  }

  disconnect() {
    console.log('✓ Disconnecting...');

    if (db && this.roomId && this.playerId) {
      db.ref('rooms/' + this.roomId + '/players/' + this.playerId).remove();
    }

    if (this.roomRef) {
      this.roomRef.off();
    }

    this.listeners = [];
    this.roomId = null;
    this.opponentId = null;
    this.isConnected = false;
  }
}

// ========== GLOBAL INSTANCE ==========
const multiplayerEngine = new MultiplayerEngine();
window.multiplayerEngine = multiplayerEngine;
console.log('✓ window.multiplayerEngine created');

// ========== INITIALIZE FIREBASE ==========
function initFirebase() {
  console.log('🔥 initFirebase() called');
  console.log('typeof firebase:', typeof firebase);

  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig);
      console.log('✓ Firebase app initialized');
    } else {
      app = firebase.app();
      console.log('✓ Firebase app already exists');
    }

    db = firebase.database();
    firebaseReady = true;

    console.log('✅✅✅ Firebase READY!');
    console.log('Database URL:', firebaseConfig.databaseURL);
    console.log('db object:', db);
  } catch (e) {
    console.error('❌ Firebase init error:', e);
    alert('Firebase initialization failed: ' + e.message);
  }
}

// ========== SETUP UI ==========
function setupMultiplayerUI() {
  console.log('🎨 setupMultiplayerUI() called');

  const container = document.getElementById('multiplayer-modal-container');
  console.log('Modal container found?', !!container);

  if (!container) {
    console.error('❌ Modal container #multiplayer-modal-container NOT FOUND!');
    return;
  }

  const modalHTML = `
    <div id="multiplayer-modal" class="hidden">
      <div class="multiplayer-modal-content">
        <h2>Multiplayer</h2>
        
        <div id="room-selection">
          <div class="section-header">Create or Join</div>
          <button id="create-room-btn">Create Room</button>
          
          <div class="join-input-group">
            <input type="text" id="room-id-input" placeholder="Enter Room ID...">
            <button id="join-room-btn">Join</button>
          </div>
        </div>
        
        <div id="copy-section" style="display: none;">
          <p>Your Room ID:</p>
          <p><span id="room-id-display">ROOM00000</span></p>
          <button id="copy-btn">📋 Copy ID</button>
        </div>
        
        <div id="waiting-section" style="display: none;">
          <p>⏳ Waiting for opponent to join...</p>
          <button id="cancel-waiting-btn">Cancel</button>
        </div>
        
        <button id="close-multiplayer-btn" type="button">✕</button>
      </div>
    </div>
  `;

  container.innerHTML = modalHTML;
  console.log('✓ Modal HTML injected');

  setupMultiplayerHandlers();
}

// ========== SETUP EVENT HANDLERS ==========
function setupMultiplayerHandlers() {
  console.log('🎮 setupMultiplayerHandlers() called');

  const multiplayerBtn = document.getElementById('multiplayer-btn');
  const modal = document.getElementById('multiplayer-modal');
  const createBtn = document.getElementById('create-room-btn');
  const joinBtn = document.getElementById('join-room-btn');
  const cancelBtn = document.getElementById('cancel-waiting-btn');
  const closeBtn = document.getElementById('close-multiplayer-btn');
  const roomDisplay = document.getElementById('room-id-display');
  const copySection = document.getElementById('copy-section');
  const roomSelection = document.getElementById('room-selection');
  const waitingSection = document.getElementById('waiting-section');
  const copyBtn = document.getElementById('copy-btn');
  const roomIdInput = document.getElementById('room-id-input');

  // Open modal
  if (multiplayerBtn && modal) {
    multiplayerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('✓ Multiplayer button clicked');
      modal.classList.remove('hidden');
    });
  }

  // Create room
  if (createBtn) {
    createBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('✓ Create room button clicked');

      multiplayerEngine.createRoom((roomId) => {
        if (roomId) {
          console.log('✓ Room created, updating UI...');
          roomDisplay.textContent = roomId;
          
          // Use inline styles to ensure visibility
          roomSelection.style.display = 'none';
          copySection.style.display = 'block';
          waitingSection.style.display = 'block';
          
          console.log('✓ UI updated - showing copy section and waiting section');
        }
      });
    });
  }

  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const roomId = roomDisplay.textContent;
      navigator.clipboard.writeText(roomId).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          copyBtn.textContent = '📋 Copy ID';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy room ID');
      });
    });
  }

  // Join room
  if (joinBtn) {
    joinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const roomId = roomIdInput.value.trim().toUpperCase();

      if (roomId) {
        console.log('✓ Attempting to join room:', roomId);
        multiplayerEngine.joinRoom(roomId, (success) => {
          if (success) {
            console.log('✓ Join successful, updating UI...');
            roomSelection.style.display = 'none';
            waitingSection.style.display = 'block';
            copySection.style.display = 'none';
            console.log('✓ UI updated - showing waiting section');
          }
        });
      } else {
        alert('Please enter a room ID');
      }
    });
  }

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('✓ Cancel clicked');
      multiplayerEngine.disconnect();
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
    });
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('✓ Close clicked');
      multiplayerEngine.disconnect();
      modal.classList.add('hidden');
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
    });
  }

  // Click outside modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('✓ Clicked outside modal');
        multiplayerEngine.disconnect();
        modal.classList.add('hidden');
        roomSelection.style.display = 'block';
        copySection.style.display = 'none';
        waitingSection.style.display = 'none';
        roomIdInput.value = '';
      }
    });
  }
}

// ========== OPPONENT CONNECTED CALLBACK ==========
window.onOpponentConnected = function() {
  console.log('✓✓✓ OPPONENT CONNECTED CALLBACK TRIGGERED! ✓✓✓');
  
  const waitingSection = document.getElementById('waiting-section');
  const cancelBtn = document.getElementById('cancel-waiting-btn');
  
  if (!waitingSection) {
    console.error('❌ Waiting section not found!');
    return;
  }
  
  console.log('✓ Waiting section found, updating UI...');
  
  // Update message
  const msg = waitingSection.querySelector('p');
  if (msg) {
    msg.innerHTML = '✅ <strong>Opponent connected!</strong>';
    msg.style.color = '#4ade80';
    msg.style.fontSize = '18px';
    msg.style.marginBottom = '20px';
    console.log('✓ Message updated');
  }
  
  // Hide cancel button
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
    console.log('✓ Cancel button hidden');
  }
  
  // Add Start Race button (only if it doesn't exist)
  const existingStartBtn = document.getElementById('start-race-btn');
  if (!existingStartBtn) {
    console.log('✓ Creating Start Race button...');
    const startBtn = document.createElement('button');
    startBtn.id = 'start-race-btn';
    startBtn.textContent = 'Start Race!';
    startBtn.style.cssText = `
      background: #e2b714 !important;
      color: #323437 !important;
      border: none !important;
      padding: 16px 32px !important;
      border-radius: 4px !important;
      font-family: 'Roboto Mono', monospace !important;
      font-weight: 700 !important;
      font-size: 18px !important;
      cursor: pointer !important;
      width: 100% !important;
      transition: all 0.2s !important;
      text-transform: uppercase !important;
      letter-spacing: 2px !important;
      margin-top: 10px !important;
    `;
    
    startBtn.addEventListener('click', () => {
      console.log('🏁 START RACE CLICKED!');
      
      // Close modal
      const modal = document.getElementById('multiplayer-modal');
      if (modal) {
        modal.classList.add('hidden');
        console.log('✓ Modal closed');
      }
      
      // Reset UI
      const roomSelection = document.getElementById('room-selection');
      const copySection = document.getElementById('copy-section');
      if (roomSelection) roomSelection.style.display = 'block';
      if (copySection) copySection.style.display = 'none';
      if (waitingSection) waitingSection.style.display = 'none';
      if (cancelBtn) cancelBtn.style.display = 'block';
      
      // Remove start button for next time
      startBtn.remove();
      
      // Reset message
      if (msg) {
        msg.innerHTML = '⏳ Waiting for opponent to join...';
        msg.style.color = '';
        msg.style.fontSize = '';
      }
      
      // Focus on typing input to start race
      const userInput = document.getElementById('user-input');
      if (userInput) {
        userInput.focus();
        console.log('✓ Race started! Input focused.');
      }
      
      // Optional: Add a countdown
      let countdown = 3;
      const timerDisplay = document.getElementById('timer');
      const countdownInterval = setInterval(() => {
        if (timerDisplay) {
          timerDisplay.textContent = countdown;
        }
        countdown--;
        
        if (countdown < 0) {
          clearInterval(countdownInterval);
          if (timerDisplay) {
            timerDisplay.textContent = '30';
          }
          console.log('✓ Countdown complete! GO!');
        }
      }, 1000);
    });
    
    waitingSection.appendChild(startBtn);
    console.log('✓ Start Race button added to DOM');
  } else {
    console.log('⚠ Start Race button already exists');
  }
};

// ========== OPPONENT STATS UPDATE ==========
window.onOpponentStatsUpdate = function(stats) {
  console.log('📊 Opponent stats:', stats);
  // You can add UI here to show opponent's WPM/progress
};

// ========== INITIALIZE ON DOM LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ DOM loaded');
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK not loaded!');
    return;
  }
  
  initFirebase();
  setupMultiplayerUI();
});