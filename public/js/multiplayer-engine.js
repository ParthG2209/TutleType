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
  }
  
  createRoom(callback) {
    console.log('📝 createRoom() called');
    
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
    
    console.log('📤 Writing to Firebase:', this.roomId);
    
    db.ref('rooms/' + this.roomId).set(roomData)
      .then(() => {
        console.log('✓✓✓ Room created successfully!');
        this.setupRoomListener();
        if (callback) callback(this.roomId);
      })
      .catch(err => {
        console.error('❌ Firebase write error:', err);
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

// ========== INITIALIZE FIREBASE ==========

function initFirebase() {
  console.log('🔥 Initializing Firebase...');
  
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
    
    console.log('✓✓✓ Firebase ready!');
    console.log('Database URL:', firebaseConfig.databaseURL);
    
  } catch (e) {
    console.error('❌ Firebase init error:', e);
    alert('Firebase initialization failed: ' + e.message);
  }
}

// ========== SETUP UI ==========

function setupMultiplayerUI() {
  console.log('🎨 Setting up multiplayer UI...');
  
  const container = document.getElementById('multiplayer-modal-container');
  if (!container) {
    console.error('❌ Modal container not found!');
    return;
  }
  
  const modalHTML = `
    <div id="multiplayer-modal" class="hidden">
      <div class="multiplayer-modal-content">
        <h2>Multiplayer</h2>
        
        <div id="room-selection">
          <div class="section-header">Create or Join</div>
          <button id="create-room-btn" type="button">Create Room</button>
          
          <div class="join-input-group">
            <input type="text" id="room-id-input" placeholder="Enter Room ID...">
            <button id="join-room-btn" type="button">Join</button>
          </div>
        </div>
        
        <div id="copy-section" style="display: none;">
          <p>Your Room ID:</p>
          <p><span id="room-id-display">ROOM00000</span></p>
          <button id="copy-btn" type="button">📋 Copy ID</button>
        </div>
        
        <div id="waiting-section" style="display: none;">
          <p>⏳ Waiting for opponent to join...</p>
          <button id="cancel-waiting-btn" type="button">Cancel</button>
        </div>
        
        <button id="close-multiplayer-btn" type="button">✕</button>
      </div>
    </div>
  `;
  
  container.innerHTML = modalHTML;
  console.log('✓ Modal HTML injected');
  
  // IMPORTANT: Wait a tiny bit for DOM to update
  setTimeout(() => {
    attachEventListeners();
  }, 100);
}

function attachEventListeners() {
  console.log('🔗 Attaching event listeners...');
  
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
  
  console.log('Elements check:', {
    multiplayerBtn: !!multiplayerBtn,
    modal: !!modal,
    createBtn: !!createBtn,
    joinBtn: !!joinBtn
  });
  
  if (!multiplayerBtn || !modal || !createBtn) {
    console.error('❌ Critical elements missing!');
    return;
  }
  
  // Open modal
  multiplayerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('✓ Open modal clicked');
    modal.classList.remove('hidden');
  });
  
  // Create room
  createBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🚀🚀🚀 CREATE ROOM CLICKED! 🚀🚀🚀');
    
    if (!firebaseReady || !db) {
      alert('Firebase not ready. Please wait and try again.');
      return;
    }
    
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    console.log('Button disabled, calling createRoom()...');
    
    multiplayerEngine.createRoom((roomId) => {
      console.log('Callback received, roomId:', roomId);
      
      if (roomId) {
        roomDisplay.textContent = roomId;
        roomSelection.style.display = 'none';
        copySection.style.display = 'block';
        waitingSection.style.display = 'block';
        console.log('✓ UI updated with room:', roomId);
      } else {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Room';
        console.error('Room creation failed');
      }
    });
  });
  
  console.log('✓ Create button listener attached');
  
  // Copy button
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const roomId = roomDisplay.textContent;
    navigator.clipboard.writeText(roomId).then(() => {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => copyBtn.textContent = '📋 Copy ID', 2000);
    });
  });
  
  // Join room
  joinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const roomId = roomIdInput.value.trim().toUpperCase();
    
    if (!roomId) {
      alert('Please enter a room ID');
      return;
    }
    
    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';
    
    multiplayerEngine.joinRoom(roomId, (success) => {
      if (success) {
        roomSelection.style.display = 'none';
        waitingSection.style.display = 'block';
      }
      joinBtn.disabled = false;
      joinBtn.textContent = 'Join';
    });
  });
  
  // Cancel
  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    multiplayerEngine.disconnect();
    roomSelection.style.display = 'block';
    copySection.style.display = 'none';
    waitingSection.style.display = 'none';
    roomIdInput.value = '';
    createBtn.disabled = false;
    createBtn.textContent = 'Create Room';
  });
  
  // Close modal
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    multiplayerEngine.disconnect();
    modal.classList.add('hidden');
    roomSelection.style.display = 'block';
    copySection.style.display = 'none';
    waitingSection.style.display = 'none';
    roomIdInput.value = '';
    createBtn.disabled = false;
    createBtn.textContent = 'Create Room';
  });
  
  // Click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      multiplayerEngine.disconnect();
      modal.classList.add('hidden');
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      createBtn.disabled = false;
      createBtn.textContent = 'Create Room';
    }
  });
  
  // Opponent callback
  window.onOpponentConnected = function() {
    console.log('✓✓✓ OPPONENT CONNECTED!');
    const msg = document.querySelector('#waiting-section p');
    if (msg) {
      msg.innerHTML = '✓ <strong>Opponent connected!</strong> Ready to race!';
      msg.style.color = '#4ade80';
    }
  };
  
  console.log('✓✓✓ All listeners attached successfully!');
}

// ========== WAIT FOR FIREBASE SDK ==========

function waitForFirebaseSDK(callback, attempts = 0) {
  if (typeof firebase !== 'undefined' && firebase.database) {
    console.log('✓ Firebase SDK loaded');
    callback();
  } else if (attempts < 50) {
    setTimeout(() => waitForFirebaseSDK(callback, attempts + 1), 100);
  } else {
    console.error('❌ Firebase SDK failed to load');
    alert('Firebase SDK failed to load. Please refresh the page.');
  }
}

// ========== START ON DOM READY ==========

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('🚀 Initializing multiplayer system...');
  
  waitForFirebaseSDK(() => {
    initFirebase();
    setupMultiplayerUI();
  });
}