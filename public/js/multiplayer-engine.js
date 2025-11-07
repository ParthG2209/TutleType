// ========== FIREBASE CONFIGURATION ==========

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

// Initialize Firebase
let app, db;
try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.database(app);
  console.log('✓ Firebase connected');
} catch (e) {
  console.error('Firebase initialization error:', e);
}

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
  }
  
  createRoom() {
    this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.isHost = true;
    console.log('✓ Room created (HOST):', this.roomId);
    
    if (db) {
      db.ref('rooms/' + this.roomId).set({
        host: this.playerId,
        created: firebase.database.ServerValue.TIMESTAMP,
        status: 'waiting',
        players: {
          [this.playerId]: {
            status: 'ready',
            role: 'host',
            wpm: 0,
            accuracy: 100,
            progress: 0
          }
        }
      }).then(() => {
        console.log('✓ Room created in Firebase');
        this.setupRoomListener();
      }).catch(err => {
        console.error('Error creating room:', err);
      });
    }
    
    return this.roomId;
  }
  
  joinRoom(roomId) {
    this.roomId = roomId;
    this.isHost = false;
    console.log('✓ Joining room (GUEST):', this.roomId);
    
    if (db) {
      db.ref('rooms/' + roomId).once('value').then(snapshot => {
        if (snapshot.exists()) {
          db.ref('rooms/' + roomId + '/players/' + this.playerId).set({
            status: 'ready',
            role: 'guest',
            wpm: 0,
            accuracy: 100,
            progress: 0
          }).then(() => {
            console.log('✓ Joined room in Firebase');
            this.setupRoomListener();
          });
        } else {
          console.error('Room does not exist');
          alert('Room not found! Check the Room ID.');
        }
      }).catch(err => {
        console.error('Error joining room:', err);
      });
    }
    
    return this.roomId;
  }
  
  setupRoomListener() {
    if (!db || !this.roomId) return;
    
    this.roomRef = db.ref('rooms/' + this.roomId + '/players');
    
    const callback = (snapshot) => {
      const players = snapshot.val();
      if (players) {
        const playerIds = Object.keys(players);
        console.log('Players in room:', playerIds.length);
        
        const opponent = playerIds.find(id => id !== this.playerId);
        
        if (opponent && !this.isConnected) {
          this.opponentId = opponent;
          this.isConnected = true;
          console.log('✓✓✓ OPPONENT CONNECTED! ✓✓✓');
          
          if (window.onOpponentConnected) {
            window.onOpponentConnected();
          }
        }
        
        if (opponent && window.onOpponentStatsUpdate) {
          const opponentData = players[opponent];
          window.onOpponentStatsUpdate(opponentData);
        }
      }
    };
    
    this.roomRef.on('value', callback);
    this.listeners.push({ ref: this.roomRef, callback });
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
    
    this.listeners.forEach(listener => {
      if (listener.ref) {
        listener.ref.off();
      }
    });
    
    this.listeners = [];
    this.roomId = null;
    this.opponentId = null;
    this.isConnected = false;
  }
}

// ========== INITIALIZE MULTIPLAYER ==========

const multiplayerEngine = new MultiplayerEngine();
window.multiplayerEngine = multiplayerEngine;

// ========== LOAD MODAL HTML AND SETUP UI ==========

function initializeMultiplayerUI() {
  console.log('✓ Initializing multiplayer UI...');
  
  // Load modal HTML
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
        
        <div id="copy-section">
          <p>Your Room ID:</p>
          <p><span id="room-id-display">ROOM00000</span></p>
          <button id="copy-btn">📋 Copy ID</button>
        </div>
        
        <div id="waiting-section">
          <p>⏳ Waiting for opponent to join...</p>
          <button id="cancel-waiting-btn">Cancel</button>
        </div>
        
        <button id="close-multiplayer-btn" type="button">✕</button>
      </div>
    </div>
  `;
  
  const container = document.getElementById('multiplayer-modal-container');
  if (container) {
    container.innerHTML = modalHTML;
    console.log('✓ Modal HTML loaded');
  } else {
    console.error('Modal container not found!');
    return;
  }
  
  // Wait a moment for DOM to update, then setup handlers
  setTimeout(() => {
    setupMultiplayerHandlers();
  }, 100);
}

function setupMultiplayerHandlers() {
  console.log('✓ Setting up multiplayer handlers...');
  
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
  
  console.log('Elements found:', {
    multiplayerBtn: !!multiplayerBtn,
    modal: !!modal,
    createBtn: !!createBtn,
    joinBtn: !!joinBtn
  });
  
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
      e.stopPropagation();
      console.log('✓ Create room button clicked');
      
      const roomId = multiplayerEngine.createRoom();
      roomDisplay.textContent = roomId;
      
      roomSelection.style.display = 'none';
      copySection.style.display = 'block';
      waitingSection.style.display = 'block';
      
      console.log('✓ Room ID displayed:', roomId);
    });
  } else {
    console.error('Create room button not found!');
  }
  
  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const roomId = roomDisplay.textContent;
      navigator.clipboard.writeText(roomId);
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy ID';
      }, 2000);
    });
  }
  
  // Join room
  if (joinBtn) {
    joinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const roomId = roomIdInput.value.trim().toUpperCase();
      
      if (roomId) {
        multiplayerEngine.joinRoom(roomId);
        roomSelection.style.display = 'none';
        waitingSection.style.display = 'block';
      } else {
        alert('Please enter a room ID');
      }
    });
  }
  
  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
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
        multiplayerEngine.disconnect();
        modal.classList.add('hidden');
        roomSelection.style.display = 'block';
        copySection.style.display = 'none';
        waitingSection.style.display = 'none';
        roomIdInput.value = '';
      }
    });
  }
  
  // Opponent connected callback
  window.onOpponentConnected = function() {
    console.log('✓✓✓ OPPONENT CONNECTED! ✓✓✓');
    const waitingMsg = document.querySelector('#waiting-section p');
    if (waitingMsg) {
      waitingMsg.innerHTML = '✓ <strong>Opponent connected!</strong> Ready to race!';
      waitingMsg.style.color = '#4ade80';
      waitingMsg.style.fontSize = '16px';
    }
  };
  
  // Opponent stats update callback
  window.onOpponentStatsUpdate = function(stats) {
    console.log('Opponent stats:', stats);
  };
  
  console.log('✓ Multiplayer handlers setup complete');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  console.log('✓ DOM LOADED - Starting multiplayer initialization');
  initializeMultiplayerUI();
});
