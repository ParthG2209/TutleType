// ========== MULTIPLAYER ENGINE (Backend Logic Only) ==========
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
    this.displayName = 'Player' + Math.floor(Math.random() * 9999);
    this.opponentId = null;
    this.opponentData = null;
    this.isHost = false;
    this.roomRef = null;
    this.raceStatus = 'idle'; // idle, countdown, in_progress, finished
    this.countdownEndsAt = null;
    this.startedAt = null;
    this.finishedAt = null;
    this.words = [];
    this.totalWords = 0;
    this.wordsCompleted = 0;
    this.telemetryThrottle = null;
    this.countdownInterval = null;
    
    console.log('✓ MultiplayerEngine created, playerId:', this.playerId);
  }

  // ========== ROOM CREATION ==========
  createRoom(wordSetId = 'default', wordCount = 50, callback) {
    console.log('📝 Creating room with wordSetId:', wordSetId);

    if (!db) {
      console.error('❌ Database not initialized');
      if (callback) callback(null, null);
      return;
    }

    this.roomId = 'ROOM' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    this.isHost = true;

    // Generate locked word set for the race
    if (typeof generateWords === 'function') {
      this.words = generateWords(wordCount);
    } else {
      console.error('❌ generateWords function not found');
      if (callback) callback(null, null);
      return;
    }

    this.totalWords = this.words.length;

    const roomData = {
      host: this.playerId,
      created: firebase.database.ServerValue.TIMESTAMP,
      status: 'idle',
      wordSetId: wordSetId,
      words: this.words,
      totalWords: this.totalWords,
      countdownEndsAt: null,
      startedAt: null,
      finishedAt: null,
      players: {}
    };

    roomData.players[this.playerId] = {
      displayName: this.displayName,
      role: 'host',
      connected: true,
      wordsCompleted: 0,
      wpm: 0,
      accuracy: 100,
      timeElapsed: 0,
      finishedAt: null,
      lastUpdate: firebase.database.ServerValue.TIMESTAMP
    };

    console.log('📤 Writing room to Firebase:', this.roomId);

    db.ref('rooms/' + this.roomId).set(roomData)
      .then(() => {
        console.log('✅ Room created successfully');
        this.setupRoomListener();
        if (callback) callback(this.roomId, this.words);
      })
      .catch(err => {
        console.error('❌ Room creation failed:', err);
        if (callback) callback(null, null);
      });
  }

  // ========== JOIN ROOM ==========
  joinRoom(roomId, callback) {
    console.log('📝 Joining room:', roomId);

    if (!db) {
      console.error('❌ Database not initialized');
      if (callback) callback(false, null, null);
      return;
    }

    this.roomId = roomId;
    this.isHost = false;

    db.ref('rooms/' + roomId).once('value')
      .then(snapshot => {
        if (!snapshot.exists()) {
          throw new Error('Room does not exist');
        }

        const roomData = snapshot.val();
        
        // Load locked words and state from room
        this.words = roomData.words || [];
        this.totalWords = roomData.totalWords || this.words.length;
        this.raceStatus = roomData.status || 'idle';
        this.countdownEndsAt = roomData.countdownEndsAt;
        this.startedAt = roomData.startedAt;

        const playerData = {
          displayName: this.displayName,
          role: 'guest',
          connected: true,
          wordsCompleted: 0,
          wpm: 0,
          accuracy: 100,
          timeElapsed: 0,
          finishedAt: null,
          lastUpdate: firebase.database.ServerValue.TIMESTAMP
        };

        return db.ref('rooms/' + roomId + '/players/' + this.playerId).set(playerData);
      })
      .then(() => {
        console.log('✅ Joined room successfully');
        this.setupRoomListener();
        if (callback) callback(true, this.words, this.raceStatus);
      })
      .catch(err => {
        console.error('❌ Failed to join room:', err);
        alert('Failed to join room: ' + err.message);
        if (callback) callback(false, null, null);
      });
  }

  // ========== ROOM LISTENER ==========
  setupRoomListener() {
    if (!db || !this.roomId) return;

    this.roomRef = db.ref('rooms/' + this.roomId);

    this.roomRef.on('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;

      // Update room state
      const prevStatus = this.raceStatus;
      this.raceStatus = roomData.status;
      this.countdownEndsAt = roomData.countdownEndsAt;
      this.startedAt = roomData.startedAt;
      this.finishedAt = roomData.finishedAt;

      const players = roomData.players || {};
      const playerIds = Object.keys(players);

      // Find and track opponent
      const opponentId = playerIds.find(id => id !== this.playerId);
      if (opponentId && !this.opponentId) {
        this.opponentId = opponentId;
        this.opponentData = players[opponentId];
        console.log('✓ Opponent connected:', this.opponentData.displayName);
        
        // Trigger opponent connected event
        this.triggerEvent('opponentConnected', this.opponentData);
      }

      // Update opponent data
      if (opponentId && players[opponentId]) {
        this.opponentData = players[opponentId];
        this.triggerEvent('opponentUpdate', this.opponentData);
      }

      // Handle state transitions
      if (prevStatus !== this.raceStatus) {
        console.log('🔄 Race status changed:', prevStatus, '→', this.raceStatus);

        if (this.raceStatus === 'countdown') {
          this.handleCountdownStart();
        } else if (this.raceStatus === 'in_progress') {
          this.handleRaceStart();
        } else if (this.raceStatus === 'finished') {
          this.handleRaceFinish(roomData);
        }
      }
    });

    // Handle disconnection
    const connectedRef = db.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
      if (snapshot.val() === false) return;

      // Set up automatic disconnect cleanup
      db.ref('rooms/' + this.roomId + '/players/' + this.playerId + '/connected')
        .onDisconnect()
        .set(false);
    });
  }

  // ========== INITIATE RACE (Trigger Countdown) ==========
  initiateRace(countdownSeconds = 3) {
    console.log('🏁 Initiating race with', countdownSeconds, 's countdown');

    if (this.raceStatus !== 'idle') {
      console.warn('⚠ Cannot initiate race, current status:', this.raceStatus);
      return;
    }

    const countdownEndsAt = Date.now() + (countdownSeconds * 1000);

    db.ref('rooms/' + this.roomId).update({
      status: 'countdown',
      countdownEndsAt: countdownEndsAt
    }).then(() => {
      console.log('✅ Countdown initiated, ends at:', new Date(countdownEndsAt));
    }).catch(err => {
      console.error('❌ Failed to initiate countdown:', err);
    });
  }

  // ========== HANDLE COUNTDOWN START ==========
  handleCountdownStart() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    console.log('⏱ Countdown started, ends at:', new Date(this.countdownEndsAt));
    
    this.triggerEvent('countdownStart', this.countdownEndsAt);

    // Countdown tick every 100ms for accuracy
    this.countdownInterval = setInterval(() => {
      const remaining = Math.ceil((this.countdownEndsAt - Date.now()) / 1000);
      
      this.triggerEvent('countdownTick', remaining);

      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;

        // Only host triggers race start
        if (this.isHost) {
          const startedAt = Date.now();
          db.ref('rooms/' + this.roomId).update({
            status: 'in_progress',
            startedAt: startedAt
          }).then(() => {
            console.log('✅ Race started at:', new Date(startedAt));
          });
        }
      }
    }, 100);
  }

  // ========== HANDLE RACE START ==========
  handleRaceStart() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    console.log('🚀 Race started at:', new Date(this.startedAt));
    this.triggerEvent('raceStart', {
      words: this.words,
      startedAt: this.startedAt,
      totalWords: this.totalWords
    });
  }

  // ========== SEND TELEMETRY ==========
  sendTelemetry(wordsCompleted, wpm, accuracy, timeElapsed) {
    if (!db || !this.roomId || this.raceStatus !== 'in_progress') return;

    // Throttle to ~10 updates/sec per room (100ms)
    if (this.telemetryThrottle) return;

    this.telemetryThrottle = setTimeout(() => {
      this.telemetryThrottle = null;
    }, 100);

    this.wordsCompleted = wordsCompleted;

    db.ref('rooms/' + this.roomId + '/players/' + this.playerId).update({
      wordsCompleted: wordsCompleted,
      wpm: wpm || 0,
      accuracy: accuracy || 100,
      timeElapsed: timeElapsed || 0,
      lastUpdate: firebase.database.ServerValue.TIMESTAMP
    }).catch(err => {
      console.error('❌ Failed to send telemetry:', err);
    });
  }

  // ========== FINISH RACE ==========
  finishRace(wordsCompleted, wpm, accuracy, timeElapsed) {
    console.log('🏁 Finishing race:', { wordsCompleted, wpm, accuracy, timeElapsed });

    if (!db || !this.roomId) return;

    const finishData = {
      wordsCompleted: wordsCompleted,
      wpm: wpm,
      accuracy: accuracy,
      timeElapsed: timeElapsed,
      finishedAt: firebase.database.ServerValue.TIMESTAMP
    };

    db.ref('rooms/' + this.roomId + '/players/' + this.playerId)
      .update(finishData)
      .then(() => {
        console.log('✅ Finish data sent');
        // Check if all players finished
        return db.ref('rooms/' + this.roomId + '/players').once('value');
      })
      .then(snapshot => {
        const players = snapshot.val();
        const allFinished = Object.values(players).every(p => p.finishedAt);

        if (allFinished || Object.keys(players).length === 1) {
          // Mark room as finished
          return db.ref('rooms/' + this.roomId).update({
            status: 'finished',
            finishedAt: firebase.database.ServerValue.TIMESTAMP
          });
        }
      })
      .catch(err => {
        console.error('❌ Failed to finish race:', err);
      });
  }

  // ========== HANDLE RACE FINISH ==========
  handleRaceFinish(roomData) {
    console.log('🎉 Race finished!');

    const players = roomData.players || {};
    const results = Object.entries(players).map(([id, data]) => ({
      playerId: id,
      displayName: data.displayName || 'Unknown',
      wordsCompleted: data.wordsCompleted || 0,
      wpm: data.wpm || 0,
      accuracy: data.accuracy || 100,
      timeElapsed: data.timeElapsed || 0,
      isLocalPlayer: id === this.playerId
    }));

    // Sort by wordsCompleted (desc), then timeElapsed (asc) for ties
    results.sort((a, b) => {
      if (b.wordsCompleted !== a.wordsCompleted) {
        return b.wordsCompleted - a.wordsCompleted;
      }
      return a.timeElapsed - b.timeElapsed;
    });

    // Assign ranks with tie handling
    let currentRank = 1;
    results.forEach((result, index) => {
      if (index > 0 && result.wordsCompleted === results[index - 1].wordsCompleted) {
        result.rank = results[index - 1].rank;
        result.tie = true;
      } else {
        result.rank = currentRank;
        result.tie = false;
      }
      currentRank++;
    });

    this.triggerEvent('raceFinish', results);
  }

  // ========== DISCONNECT ==========
  disconnect() {
    console.log('🔌 Disconnecting from room');

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (db && this.roomId && this.playerId) {
      db.ref('rooms/' + this.roomId + '/players/' + this.playerId).update({
        connected: false
      });
    }

    if (this.roomRef) {
      this.roomRef.off();
      this.roomRef = null;
    }

    this.roomId = null;
    this.opponentId = null;
    this.opponentData = null;
    this.raceStatus = 'idle';
    this.wordsCompleted = 0;
  }

  // ========== EVENT SYSTEM ==========
  triggerEvent(eventName, data) {
    const eventCallback = window['on' + eventName.charAt(0).toUpperCase() + eventName.slice(1)];
    if (typeof eventCallback === 'function') {
      eventCallback(data);
    }
  }
}

// ========== INITIALIZE FIREBASE ==========
function initFirebase() {
  console.log('🔥 Initializing Firebase');

  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized');
    } else {
      app = firebase.app();
      console.log('✅ Firebase app already exists');
    }

    db = firebase.database();
    firebaseReady = true;
    console.log('✅ Firebase database ready');
  } catch (e) {
    console.error('❌ Firebase init failed:', e);
  }
}

// ========== AUTO-INITIALIZE ==========
if (typeof firebase !== 'undefined') {
  initFirebase();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
      initFirebase();
    }
  });
}

// ========== EXPORT GLOBAL INSTANCE ==========
window.multiplayerEngine = new MultiplayerEngine();
console.log('✅ multiplayerEngine available globally');