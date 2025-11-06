// ========== MULTIPLAYER ENGINE ==========

class MultiplayerEngine {
  constructor() {
    this.roomId = null;
  }
  
  createRoom() {
    this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    console.log('Room created:', this.roomId);
    return this.roomId;
  }
  
  joinRoom(roomId) {
    this.roomId = roomId;
    console.log('Joined room:', this.roomId);
    return this.roomId;
  }
}

const multiplayerEngine = new MultiplayerEngine();

document.addEventListener('DOMContentLoaded', function() {
  console.log('=== MULTIPLAYER LOADED ===');
  
  const createBtn = document.getElementById('create-room-btn');
  const joinBtn = document.getElementById('join-room-btn');
  const cancelBtn = document.getElementById('cancel-waiting-btn');
  const closeBtn = document.getElementById('close-multiplayer-btn');
  const modal = document.getElementById('multiplayer-modal');
  const roomDisplay = document.getElementById('room-id-display');
  const copySection = document.getElementById('copy-section');
  const roomSelection = document.getElementById('room-selection');
  const waitingSection = document.getElementById('waiting-section');
  const copyBtn = document.getElementById('copy-btn');
  const roomIdInput = document.getElementById('room-id-input');
  
  console.log('All elements found');
  
  // CREATE ROOM
  if (createBtn) {
    createBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✓ Create room clicked');
      
      const roomId = multiplayerEngine.createRoom();
      
      // Update display - NO ALERT
      roomDisplay.textContent = roomId;
      console.log('✓ Room ID displayed:', roomId);
      
      // Hide room selection, show copy section and waiting
      roomSelection.style.display = 'none';
      copySection.style.display = 'block';
      waitingSection.style.display = 'block';
    });
  }
  
  // COPY BUTTON
  if (copyBtn) {
    copyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const roomId = roomDisplay.textContent;
      navigator.clipboard.writeText(roomId);
      console.log('✓ Copied:', roomId);
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy ID';
      }, 2000);
    });
  }
  
  // JOIN ROOM
  if (joinBtn) {
    joinBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✓ Join button clicked');
      
      const roomId = roomIdInput.value.trim();
      console.log('Room ID entered:', roomId);
      
      if (roomId) {
        multiplayerEngine.joinRoom(roomId);
        console.log('✓ Joined room:', roomId);
        
        roomSelection.style.display = 'none';
        waitingSection.style.display = 'block';
        console.log('✓ UI updated to waiting state');
      } else {
        console.warn('No room ID entered');
        alert('Please enter a room ID');
      }
    });
  }
  
  // CANCEL BUTTON
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✓ Cancel clicked');
      
      // Reset UI
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
      
      multiplayerEngine.roomId = null;
      console.log('✓ Reset to room selection');
    });
  }
  
  // CLOSE BUTTON (X)
  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✓ Close clicked');
      
      modal.classList.add('hidden');
      modal.style.display = 'none';
      
      // Reset UI
      roomSelection.style.display = 'block';
      copySection.style.display = 'none';
      waitingSection.style.display = 'none';
      roomIdInput.value = '';
      
      multiplayerEngine.roomId = null;
    });
  }
  
  // Click outside modal to close
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        console.log('✓ Clicked outside modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        
        // Reset UI
        roomSelection.style.display = 'block';
        copySection.style.display = 'none';
        waitingSection.style.display = 'none';
        roomIdInput.value = '';
        
        multiplayerEngine.roomId = null;
      }
    });
  }
});

window.multiplayerEngine = multiplayerEngine;
