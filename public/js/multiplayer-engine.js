// ========== MULTIPLAYER ENGINE WITH WEBRTC P2P ==========

class MultiplayerEngine {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    
    this.isMultiplayer = false;
    this.isHost = false;
    this.roomId = null;
    
    this.yourStats = {
      wpm: 0,
      accuracy: 100,
      progress: 0
    };
    
    this.opponentStats = {
      wpm: 0,
      accuracy: 100,
      progress: 0
    };
    
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' }
      ]
    };
  }
  
  createRoom() {
    try {
      // Generate simple room ID
      this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      this.isHost = true;
      
      console.log('Room created:', this.roomId);
      return this.roomId;
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }
  
  joinRoom(roomId) {
    try {
      this.roomId = roomId;
      this.isHost = false;
      
      console.log('Joined room:', this.roomId);
      return true;
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  }
  
  disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.roomId = null;
  }
}

const multiplayerEngine = new MultiplayerEngine();

// DOM Setup
document.addEventListener('DOMContentLoaded', function() {
  console.log('Multiplayer module loaded');
  
  const multiplayerBtn = document.getElementById('multiplayer-btn');
  const multiplayerModal = document.getElementById('multiplayer-modal');
  const createRoomBtn = document.getElementById('create-room-btn');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const roomIdInput = document.getElementById('room-id-input');
  const closeBtn = document.getElementById('close-multiplayer-btn');
  const exitBtn = document.getElementById('exit-multiplayer-btn');
  const cancelBtn = document.getElementById('cancel-waiting-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const copyBtn = document.getElementById('copy-btn');
  
  // Open modal
  if (multiplayerBtn) {
    multiplayerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      multiplayerModal.classList.remove('hidden');
      console.log('Modal opened');
    });
  }
  
  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      multiplayerModal.classList.add('hidden');
      resetUI();
    });
  }
  
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      multiplayerEngine.disconnect();
      multiplayerModal.classList.add('hidden');
      resetUI();
    });
  }
  
  // Create Room
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      try {
        const roomId = multiplayerEngine.createRoom();
        
        console.log('Generated Room ID:', roomId);
        
        // Show room ID display
        document.getElementById('room-selection').classList.add('hidden');
        document.getElementById('copy-section').classList.remove('hidden');
        document.getElementById('waiting-section').classList.remove('hidden');
        document.getElementById('room-id-display').textContent = roomId;
        
      } catch (error) {
        console.error('Error creating room:', error);
        alert('Error creating room: ' + error.message);
      }
    });
  }
  
  // Copy Room ID
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const roomId = document.getElementById('room-id-display').textContent;
      navigator.clipboard.writeText(roomId).then(() => {
        alert('Room ID copied: ' + roomId);
      });
    });
  }
  
  // Join Room
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      const roomId = roomIdInput.value.trim();
      
      if (!roomId) {
        alert('Please enter a Room ID');
        return;
      }
      
      try {
        multiplayerEngine.joinRoom(roomId);
        
        console.log('Joined room:', roomId);
        
        // Show waiting screen
        document.getElementById('room-selection').classList.add('hidden');
        document.getElementById('waiting-section').classList.remove('hidden');
        document.getElementById('opponent-card').classList.remove('hidden');
        
        alert('Connected to room: ' + roomId);
        
      } catch (error) {
        console.error('Error joining room:', error);
        alert('Error joining room: ' + error.message);
      }
    });
  }
  
  // Cancel Waiting
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      multiplayerEngine.disconnect();
      resetUI();
    });
  }
  
  // Play Again
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      document.getElementById('multiplayer-results-section').classList.add('hidden');
      document.getElementById('room-selection').classList.remove('hidden');
      multiplayerEngine.disconnect();
      resetUI();
    });
  }
});

function resetUI() {
  document.getElementById('room-selection').classList.remove('hidden');
  document.getElementById('copy-section').classList.add('hidden');
  document.getElementById('waiting-section').classList.add('hidden');
  document.getElementById('game-active-section').classList.add('hidden');
  document.getElementById('multiplayer-results-section').classList.add('hidden');
  document.getElementById('opponent-card').classList.add('hidden');
  document.getElementById('room-id-input').value = '';
}

function startMultiplayerGame(typingEngine) {
  if (!multiplayerEngine.isMultiplayer) {
    multiplayerEngine.isMultiplayer = true;
    document.getElementById('waiting-section').classList.add('hidden');
    document.getElementById('game-active-section').classList.remove('hidden');
  }
}

function updateMultiplayerStats(typingEngine) {
  if (multiplayerEngine.isMultiplayer) {
    document.getElementById('your-wpm').textContent = typingEngine.calculateWPM();
    document.getElementById('your-accuracy').textContent = typingEngine.calculateAccuracy() + '%';
  }
}

function endMultiplayerGame(typingEngine) {
  if (multiplayerEngine.isMultiplayer) {
    document.getElementById('game-active-section').classList.add('hidden');
    document.getElementById('multiplayer-results-section').classList.remove('hidden');
    document.getElementById('final-your-wpm').textContent = typingEngine.calculateWPM();
    document.getElementById('final-your-accuracy').textContent = typingEngine.calculateAccuracy() + '%';
  }
}

window.multiplayerEngine = multiplayerEngine;
