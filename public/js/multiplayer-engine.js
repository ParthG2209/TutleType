// ========== WAIT FOR FIREBASE TO LOAD ==========

function waitForFirebase(callback, attempts = 0) {
  if (typeof firebase !== 'undefined' && firebase.database) {
    console.log('✓ Firebase SDK loaded');
    callback();
  } else if (attempts < 50) { // Try for 5 seconds max
    console.log(`⏳ Waiting for Firebase... (attempt ${attempts + 1})`);
    setTimeout(() => waitForFirebase(callback, attempts + 1), 100);
  } else {
    console.error('❌ Firebase failed to load after 5 seconds');
    alert('Firebase failed to load. Please refresh the page.');
  }
}

// ========== FIREBASE CONFIGURATION ==========

let app, db;
let firebaseReady = false;

function initializeFirebase() {
  console.log('🔥 Initializing Firebase...');
  
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

  try {
    // Check if already initialized
    if (firebase.apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    
    db = firebase.database(app);
    firebaseReady = true;
    console.log('✓✓✓ Firebase connected successfully');
    console.log('Database URL:', firebaseConfig.databaseURL);
    
    // Test connection
    db.ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✓ Firebase Realtime Database connected');
      } else {
        console.log('⚠️ Firebase Realtime Database disconnected');
      }
    });
    
  } catch (e) {
    console.error('❌ Firebase initialization error:', e);
    console.error('Error details:', e.message, e.stack);
    firebaseReady = false;
  }
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
    console.log('📝 Creating room...');
    this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.isHost = true;
    console.log('✓ Room created (HOST):', this.roomId);
    
    if (!db) {
      console.error('❌ Firebase database not initialized!');
      alert('Firebase not ready. Please refresh the page.');
      return null;
    }
    
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
      console.error('❌ Error creating room:', err);
      alert('Failed to create room: ' + err.message);
    });
    
    return this.roomId;
  }
  
  joinRoom(roomId) {
    console.log('📝 Joining room:', roomId);
    this.roomId = roomId;
    this.isHost = false;
    
    if (!db) {
      console.error('❌ Firebase database not initialized!');
      alert('Firebase not ready. Please refresh the page.');
      return null;
    }
    
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
        console.error('❌ Room does not exist');
        alert('Room not found! Check the Room ID.');
      }
    }).catch(err => {
      console.error('❌ Error joining room:', err);
      alert('Failed to join room: ' + err.message);
    });
    
    return this.roomId;
  }
  
  setupRoomListener() {
    if (!db || !this.roomId) return;
    
    this.roomRef = db.ref('rooms/' + this.roomId + '/players');
    
    const callback = (snapshot) => {
      const players = snapshot.val();
      if (players) {
        const playerIds = Object.keys(players);
        console.log('👥 Players in room:', playerIds.length);
        
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
  
  const container = document.getElementById('multiplayer-modal-container');
  if (container) {
    container.innerHTML = modalHTML;
    console.log('✓ Modal HTML loaded');
    setupMultiplayerHandlers();
  } else {
    console.error('❌ Modal container not found!');
  }
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
  
  console.log('🔍 Elements found:', {
    multiplayerBtn: !!multiplayerBtn,
    modal: !!modal,
    createBtn: !!createBtn,
    joinBtn: !!joinBtn,
    cancelBtn: !!cancelBtn,
    closeBtn: !!closeBtn
  });
  
  // Open modal
  if (multiplayerBtn && modal) {
    multiplayerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('✓ Multiplayer button clicked');
      modal.classList.remove('hidden');
    });
  } else {
    console.error('❌ Multiplayer button or modal not found!');
  }
  
  // Create room - FIXED VERSION
  if (createBtn) {
    createBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🚀 Create room button clicked!');
      
      // Disable button to prevent double-clicks
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
      
      try {
        const roomId = multiplayerEngine.createRoom();
        
        if (roomId) {
          console.log('✓ Room ID generated:', roomId);
          roomDisplay.textContent = roomId;
          
          roomSelection.style.display = 'none';
          copySection.style.display = 'block';
          waitingSection.style.display = 'block';
          
          console.log('✓ UI updated successfully');
        } else {
          console.error('❌ Failed to generate room ID');
          createBtn.disabled = false;
          createBtn.textContent = 'Create Room';
        }
      } catch (error) {
        console.error('❌ Error in create room handler:', error);
        alert('Failed to create room: ' + error.message);
        createBtn.disabled = false;
        createBtn.textContent = 'Create Room';
      }
    });
    console.log('✓ Create room event listener attached');
  } else {
    console.error('❌ Create room button not found!');
  }
  
  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
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
      e.stopPropagation();
      const roomId = roomIdInput.value.trim().toUpperCase();
      
      if (roomId) {
        console.log('📝 Attempting to join room:', roomId);
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
      e.stopPropagation();
      multiplayerEngine.disconnect();
      
      // Reset UI
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
      
      // Re-enable create button
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Room';
      }
    });
  }
  
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      multiplayerEngine.disconnect();
      modal.classList.add('hidden');
      
      // Reset UI
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
      
      // Re-enable create button
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = 'Create Room';
      }
    });
  }
  
  // Click outside modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        multiplayerEngine.disconnect();
        modal.classList.add('hidden');
        
        // Reset UI
        roomSelection.style.display = 'block';
        copySection.style.display = 'none';
        waitingSection.style.display = 'none';
        roomIdInput.value = '';
        
        // Re-enable create button
        if (createBtn) {
          createBtn.disabled = false;
          createBtn.textContent = 'Create Room';
        }
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
  
  console.log('✓ Multiplayer handlers setup complete');
}

// ========== START INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', function() {
  console.log('✓ DOM LOADED');
  waitForFirebase(() => {
    console.log('✓ Firebase loaded, initializing...');
    initializeFirebase();
    initializeMultiplayerUI();
  });
});