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
    console.log('All elements with id containing "modal":', 
      Array.from(document.querySelectorAll('[id*="modal"]')).map(el => el.id));
    return;
  }
  
  const modalHTML = `
    <div id="multiplayer-modal" class="hidden">
      <div class="multiplayer-modal-content">
        <h2>Multiplayer</h2>
        
        <div id="room-selection">
          <div class="section-header">Create or Join</div>
          <button id="create-room-btn" type="button" style="background: red; color: white; padding: 20px; font-size: 18px; cursor: pointer;">CREATE ROOM (CLICK ME)</button>
          
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
  console.log('✓ Modal HTML injected into container');
  
  // Check if modal exists immediately
  const modal = document.getElementById('multiplayer-modal');
  console.log('Modal exists after injection?', !!modal);
  
  // Check if button exists immediately
  const btn = document.getElementById('create-room-btn');
  console.log('Create button exists after injection?', !!btn);
  
  if (btn) {
    console.log('Button element:', btn);
    console.log('Button innerHTML:', btn.innerHTML);
  }
  
  // Wait for DOM to settle, then attach listeners
  setTimeout(() => {
    console.log('⏰ setTimeout fired, calling attachEventListeners()');
    attachEventListeners();
  }, 200);
}

function attachEventListeners() {
  console.log('🔗 attachEventListeners() called');
  
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
  
  console.log('🔍 Element check:');
  console.log('  multiplayerBtn:', !!multiplayerBtn, multiplayerBtn);
  console.log('  modal:', !!modal, modal);
  console.log('  createBtn:', !!createBtn, createBtn);
  console.log('  joinBtn:', !!joinBtn, joinBtn);
  console.log('  cancelBtn:', !!cancelBtn);
  console.log('  closeBtn:', !!closeBtn);
  
  if (!multiplayerBtn) {
    console.error('❌ CRITICAL: #multiplayer-btn not found in DOM!');
    console.log('Searching for elements with "multiplayer" in id:');
    document.querySelectorAll('[id*="multiplayer"]').forEach(el => {
      console.log('  Found:', el.id, el);
    });
    return;
  }
  
  if (!modal) {
    console.error('❌ CRITICAL: #multiplayer-modal not found after injection!');
    return;
  }
  
  if (!createBtn) {
    console.error('❌ CRITICAL: #create-room-btn not found after injection!');
    console.log('Content of modal:', modal.innerHTML.substring(0, 500));
    return;
  }
  
  // Open modal
  multiplayerBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Multiplayer button CLICKED');
    modal.classList.remove('hidden');
    console.log('Modal hidden class removed');
  });
  console.log('✓ Multiplayer button listener attached');
  
  // Create room - MULTIPLE METHODS
  createBtn.onclick = function(e) {
    console.log('🚀🚀🚀 CREATE ROOM CLICKED (onclick)! 🚀🚀🚀');
    e.preventDefault();
    e.stopPropagation();
    handleCreateRoom();
  };
  
  createBtn.addEventListener('click', function(e) {
    console.log('🚀🚀🚀 CREATE ROOM CLICKED (addEventListener)! 🚀🚀🚀');
    e.preventDefault();
    e.stopPropagation();
  });
  
  createBtn.addEventListener('mousedown', function(e) {
    console.log('🖱️ CREATE ROOM MOUSEDOWN!');
  });
  
  console.log('✓ Create button listeners attached (onclick + addEventListener)');
  
  function handleCreateRoom() {
    console.log('📞 handleCreateRoom() called');
    console.log('firebaseReady:', firebaseReady);
    console.log('db:', db);
    
    if (!firebaseReady || !db) {
      alert('Firebase not ready. Please wait and try again.');
      console.error('Firebase not ready, aborting');
      return;
    }
    
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';
    console.log('Button disabled, text changed');
    console.log('Calling multiplayerEngine.createRoom()...');
    
    multiplayerEngine.createRoom((roomId) => {
      console.log('✅ createRoom callback received');
      console.log('roomId:', roomId);
      
      if (roomId) {
        roomDisplay.textContent = roomId;
        roomSelection.style.display = 'none';
        copySection.style.display = 'block';
        waitingSection.style.display = 'block';
        console.log('✓ UI updated successfully');
      } else {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Room';
        console.error('Room creation returned null');
      }
    });
  }
  
  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const roomId = roomDisplay.textContent;
      navigator.clipboard.writeText(roomId).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy ID', 2000);
      });
    });
    console.log('✓ Copy button listener attached');
  }
  
  // Join room
  if (joinBtn) {
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
    console.log('✓ Join button listener attached');
  }
  
  // Cancel
  if (cancelBtn) {
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
    console.log('✓ Cancel button listener attached');
  }
  
  // Close modal
  if (closeBtn) {
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
    console.log('✓ Close button listener attached');
  }
  
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
  console.log('✓ Modal outside click listener attached');
  
  // Opponent callback
  window.onOpponentConnected = function() {
    console.log('✓✓✓ OPPONENT CONNECTED!');
    const msg = document.querySelector('#waiting-section p');
    if (msg) {
      msg.innerHTML = '✓ <strong>Opponent connected!</strong> Ready to race!';
      msg.style.color = '#4ade80';
    }
  };
  
  console.log('✅✅✅ ALL EVENT LISTENERS ATTACHED SUCCESSFULLY!');
}

// ========== WAIT FOR FIREBASE SDK ==========

function waitForFirebaseSDK(callback, attempts = 0) {
  console.log('⏳ Waiting for Firebase SDK... attempt', attempts + 1);
  
  if (typeof firebase !== 'undefined' && firebase.database) {
    console.log('✅ Firebase SDK loaded!');
    callback();
  } else if (attempts < 50) {
    setTimeout(() => waitForFirebaseSDK(callback, attempts + 1), 100);
  } else {
    console.error('❌ Firebase SDK failed to load after 5 seconds');
    alert('Firebase SDK failed to load. Please refresh the page.');
  }
}

// ========== START ON DOM READY ==========

function init() {
  console.log('🚀 init() called');
  console.log('document.readyState:', document.readyState);
  
  waitForFirebaseSDK(() => {
    initFirebase();
    setupMultiplayerUI();
  });
}

console.log('📝 Checking document.readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('Document still loading, adding DOMContentLoaded listener');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('Document already loaded, calling init()');
  init();
}

console.log('🟢 End of multiplayer-engine.js file');