class TypingEngine {
    constructor() {
        this.words = [];
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.input = '';
        this.wordInputs = [];
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.startTime = null;
        this.endTime = null;
        this.timerInterval = null;
        this.isTestActive = false;
        this.isTestComplete = false;
        this.mode = 'time';
        this.modeValue = 30;
        this.currentTime = 30;
        this.wpmHistory = [];
        this.wpmTrackingInterval = null;
    }

    init(mode = 'time', value = 30) {
        this.mode = mode;
        this.modeValue = value;
        this.currentTime = mode === 'time' ? value : 0;
        this.reset();
    }

    reset() {
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.input = '';
        this.wordInputs = [];
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.startTime = null;
        this.endTime = null;
        this.isTestActive = false;
        this.isTestComplete = false;
        this.currentTime = this.mode === 'time' ? this.modeValue : 0;
        this.wpmHistory = [];
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.wpmTrackingInterval) {
            clearInterval(this.wpmTrackingInterval);
            this.wpmTrackingInterval = null;
        }

        const wordCount = this.mode === 'words' ? this.modeValue : 100;
        this.words = generateWords(wordCount);
        this.wordInputs = new Array(this.words.length).fill('');
        
        this.render();
        this.updateStats();
        this.updateCaret();
        
        // Hide results if they exist
        const overlay = document.getElementById('results-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    start() {
        if (!this.isTestActive && !this.isTestComplete) {
            this.isTestActive = true;
            this.startTime = Date.now();
            
            if (this.mode === 'time') {
                this.startTimer();
            }

            // Track WPM every second
            this.wpmTrackingInterval = setInterval(() => {
                this.wpmHistory.push(this.calculateWPM());
            }, 1000);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.currentTime > 0) {
                this.currentTime--;
                this.updateStats();
                
                if (this.currentTime <= 0) {
                    this.finish();
                }
            }
        }, 1000);
    }

    handleInput(char) {
    if (this.isTestComplete) {
        return;
    }

    if (!this.isTestActive) {
        this.start();
    }

    if (this.currentWordIndex >= this.words.length) {
        return;
    }

    const currentWord = this.words[this.currentWordIndex];
    this.input += char;
    this.wordInputs[this.currentWordIndex] = this.input;
    
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
    this.updateStats();
    
    requestAnimationFrame(() => this.updateCaret());
    
    // Check if we just completed the last character of the last word
    if (this.mode === 'words' && 
        this.currentWordIndex === this.words.length - 1 && 
        this.currentCharIndex === currentWord.length) {
        this.finish();
    }
}


    handleSpace() {
    if (this.isTestComplete) {
        return;
    }

    if (!this.isTestActive) {
        this.start();
    }

    if (this.currentWordIndex >= this.words.length - 1) {
        return;
    }

    this.currentWordIndex++;
    this.currentCharIndex = 0;
    this.input = this.wordInputs[this.currentWordIndex] || '';
    
    this.render();
    this.updateStats();
    
    requestAnimationFrame(() => this.updateCaret());
}



    handleBackspace() {
        if (this.isTestComplete) {
            return;
        }

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
            this.wordInputs[this.currentWordIndex] = this.input;
            this.currentCharIndex--;
            
        } else if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.input = this.wordInputs[this.currentWordIndex] || '';
            this.currentCharIndex = this.input.length;
        }
        
        this.render();
        this.updateStats();
        
        requestAnimationFrame(() => this.updateCaret());
    }

    finish() {
    this.isTestActive = false;
    this.isTestComplete = true;
    this.endTime = Date.now();
    
    if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    if (this.wpmTrackingInterval) {
        clearInterval(this.wpmTrackingInterval);
        this.wpmTrackingInterval = null;
    }

    this.wpmHistory.push(this.calculateWPM());
    this.updateStats();
    
    // Store results in localStorage
    const results = {
        wpm: this.calculateWPM(),
        accuracy: this.calculateAccuracy(),
        errorRate: this.calculateErrorRate(),
        time: this.getElapsedTime(),
        totalChars: this.correctChars + this.incorrectChars,
        correctChars: this.correctChars,
        incorrectChars: this.incorrectChars,
        wpmHistory: this.wpmHistory
    };
    
    localStorage.setItem('testResults', public/jsON.stringify(results));
    
    // Redirect to results page
    window.location.href = 'results.html';
}


    calculateWPM() {
        const timeInMinutes = this.getElapsedTime() / 60;
        const wordsTyped = this.correctChars / 5;
        return timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
    }

    calculateAccuracy() {
        const totalChars = this.correctChars + this.incorrectChars;
        return totalChars > 0 ? Math.round((this.correctChars / totalChars) * 100) : 100;
    }

    calculateErrorRate() {
        const totalChars = this.correctChars + this.incorrectChars;
        return totalChars > 0 ? Math.round((this.incorrectChars / totalChars) * 100) : 0;
    }

    getElapsedTime() {
        if (this.mode === 'time') {
            const elapsed = this.modeValue - this.currentTime;
            return elapsed < 0 ? 0 : elapsed;
        } else {
            if (!this.startTime) return 0;
            const endTime = this.endTime || Date.now();
            return Math.round((endTime - this.startTime) / 1000);
        }
    }

    updateStats() {
        document.getElementById('wpm').textContent = this.calculateWPM();
        document.getElementById('accuracy').textContent = this.calculateAccuracy() + '%';
        
        if (this.mode === 'time') {
            const displayTime = this.currentTime < 0 ? 0 : this.currentTime;
            document.getElementById('timer').textContent = displayTime;
        } else {
            document.getElementById('timer').textContent = this.getElapsedTime();
        }
    }

    render() {
        const textDisplay = document.getElementById('text-display');
        let html = '';

        this.words.forEach((word, wordIndex) => {
            let wordHtml = '<span class="word';
            
            if (wordIndex === this.currentWordIndex) {
                wordHtml += ' active';
            }
            
            wordHtml += '">';
            
            const typedInput = this.wordInputs[wordIndex] || '';
            const maxLength = Math.max(word.length, wordIndex === this.currentWordIndex ? typedInput.length : 0);
            
            for (let charIndex = 0; charIndex < maxLength; charIndex++) {
                const char = word[charIndex];
                let className = 'char';
                let displayChar = char || '';
                
                if (wordIndex < this.currentWordIndex || 
                    (wordIndex === this.currentWordIndex && charIndex < this.currentCharIndex)) {
                    const typedChar = typedInput[charIndex];
                    
                    if (charIndex < word.length) {
                        if (typedChar === char) {
                            className += ' correct';
                        } else if (typedChar !== undefined) {
                            className += ' incorrect';
                        }
                    } else {
                        className += ' incorrect extra';
                        displayChar = typedInput[charIndex] || '';
                    }
                } else if (charIndex < word.length) {
                    displayChar = char;
                }
                
                if (displayChar) {
                    wordHtml += `<span class="${className}">${displayChar}</span>`;
                }
            }
            
            wordHtml += '</span>';
            html += wordHtml;
        });

        textDisplay.innerHTML = html;
    }

    updateCaret() {
        let caret = document.getElementById('caret');
        if (!caret) {
            caret = document.createElement('div');
            caret.id = 'caret';
            caret.className = 'smooth';
            document.getElementById('text-display').appendChild(caret);
        }

        setTimeout(() => {
            const words = document.querySelectorAll('.word');
            if (this.currentWordIndex >= words.length) {
                caret.style.opacity = '0';
                return;
            }
            
            caret.style.opacity = '1';
            const currentWord = words[this.currentWordIndex];
            const chars = currentWord.querySelectorAll('.char');
            
            const textDisplay = document.getElementById('text-display');
            const textDisplayRect = textDisplay.getBoundingClientRect();
            
            if (chars.length === 0) {
                const wordRect = currentWord.getBoundingClientRect();
                caret.style.left = (wordRect.left - textDisplayRect.left) + 'px';
                caret.style.top = (wordRect.top - textDisplayRect.top) + 'px';
            } else if (this.currentCharIndex === 0) {
                const firstChar = chars[0];
                const rect = firstChar.getBoundingClientRect();
                
                caret.style.left = (rect.left - textDisplayRect.left) + 'px';
                caret.style.top = (rect.top - textDisplayRect.top) + 'px';
                
            } else if (this.currentCharIndex <= chars.length) {
                const prevChar = chars[this.currentCharIndex - 1];
                const rect = prevChar.getBoundingClientRect();
                
                caret.style.left = (rect.right - textDisplayRect.left) + 'px';
                caret.style.top = (rect.top - textDisplayRect.top) + 'px';
                
            } else {
                const lastChar = chars[chars.length - 1];
                const rect = lastChar.getBoundingClientRect();
                
                caret.style.left = (rect.right - textDisplayRect.left) + 'px';
                caret.style.top = (rect.top - textDisplayRect.top) + 'px';
            }
        }, 0);
    }

    showResults() {
        const overlay = document.getElementById('results-overlay');
        if (!overlay) return;
        
        // Update metrics
        const wpmEl = document.getElementById('result-wpm');
        const accEl = document.getElementById('result-accuracy');
        const errEl = document.getElementById('result-errors');
        
        if (wpmEl) wpmEl.textContent = this.calculateWPM();
        if (accEl) accEl.textContent = this.calculateAccuracy() + '%';
        if (errEl) errEl.textContent = this.calculateErrorRate() + '%';
        
        // Draw graph
        this.drawPerformanceGraph();
        
        // Show overlay
        overlay.classList.add('show');
    }

    hideResults() {
        const overlay = document.getElementById('results-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    drawPerformanceGraph() {
        const canvas = document.getElementById('performance-graph');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (this.wpmHistory.length < 2) {
            return;
        }
        
        // Get accent color from CSS variable
        const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent-color').trim();
        const textSecondary = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-secondary').trim();
        
        // Calculate scales
        const maxWPM = Math.max(...this.wpmHistory, 10);
        const padding = 30;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;
        
        // Draw grid lines
        ctx.strokeStyle = textSecondary;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Draw WPM line
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        this.wpmHistory.forEach((wpm, index) => {
            const x = padding + (graphWidth / (this.wpmHistory.length - 1)) * index;
            const y = padding + graphHeight - (wpm / maxWPM) * graphHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        ctx.fillStyle = accentColor;
        this.wpmHistory.forEach((wpm, index) => {
            const x = padding + (graphWidth / (this.wpmHistory.length - 1)) * index;
            const y = padding + graphHeight - (wpm / maxWPM) * graphHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw axis labels
        ctx.fillStyle = textSecondary;
        ctx.font = '10px Roboto Mono';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 4; i++) {
            const wpm = Math.round((maxWPM / 4) * (4 - i));
            const y = padding + (graphHeight / 4) * i + 3;
            ctx.fillText(wpm, padding - 10, y);
        }
    }
}
