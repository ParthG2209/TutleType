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
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const wordCount = this.mode === 'words' ? this.modeValue : 100;
        this.words = generateWords(wordCount);
        this.wordInputs = new Array(this.words.length).fill('');
        
        this.render();
        this.updateStats();
        this.updateCaret();
    }

    start() {
        if (!this.isTestActive && !this.isTestComplete) {
            this.isTestActive = true;
            this.startTime = Date.now();
            
            if (this.mode === 'time') {
                this.startTimer();
            }
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
        // Block input if test is complete
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
        
        // Update stats
        if (this.currentCharIndex < currentWord.length) {
            if (char === currentWord[this.currentCharIndex]) {
                this.correctChars++;
            } else {
                this.incorrectChars++;
            }
        } else {
            // Extra characters
            this.incorrectChars++;
        }
        
        this.currentCharIndex++;
        this.render();
        this.updateStats();
        
        requestAnimationFrame(() => this.updateCaret());
    }

    handleSpace() {
        // Block input if test is complete
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
        // Block input if test is complete
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

        this.updateStats();
        
        setTimeout(() => {
            alert(`Test Complete!\n\nWPM: ${this.calculateWPM()}\nAccuracy: ${this.calculateAccuracy()}%\nTime: ${this.getElapsedTime()}s`);
        }, 100);
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
            
            // Render each character individually with its own color
            for (let charIndex = 0; charIndex < maxLength; charIndex++) {
                const char = word[charIndex];
                let className = 'char';
                let displayChar = char || '';
                
                if (wordIndex < this.currentWordIndex || 
                    (wordIndex === this.currentWordIndex && charIndex < this.currentCharIndex)) {
                    const typedChar = typedInput[charIndex];
                    
                    if (charIndex < word.length) {
                        // Normal character - check if correct or incorrect
                        if (typedChar === char) {
                            className += ' correct';
                        } else if (typedChar !== undefined) {
                            className += ' incorrect';
                        }
                    } else {
                        // Extra characters beyond word length
                        className += ' incorrect extra';
                        displayChar = typedInput[charIndex] || '';
                    }
                } else if (charIndex < word.length) {
                    // Untyped characters - keep default gray
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
            // If no characters in word yet, position at word start
            const wordRect = currentWord.getBoundingClientRect();
            caret.style.left = (wordRect.left - textDisplayRect.left) + 'px';
            caret.style.top = (wordRect.top - textDisplayRect.top) + 'px';
        } else if (this.currentCharIndex === 0) {
            // Position before first character
            const firstChar = chars[0];
            const rect = firstChar.getBoundingClientRect();
            
            caret.style.left = (rect.left - textDisplayRect.left) + 'px';
            caret.style.top = (rect.top - textDisplayRect.top) + 'px';
            
        } else if (this.currentCharIndex <= chars.length) {
            // Position after the previous character (to the right of it)
            const prevChar = chars[this.currentCharIndex - 1];
            const rect = prevChar.getBoundingClientRect();
            
            // Position at the RIGHT edge of the previous character
            caret.style.left = (rect.right - textDisplayRect.left) + 'px';
            caret.style.top = (rect.top - textDisplayRect.top) + 'px';
            
        } else {
            // Beyond word length - position after last character
            const lastChar = chars[chars.length - 1];
            const rect = lastChar.getBoundingClientRect();
            
            caret.style.left = (rect.right - textDisplayRect.left) + 'px';
            caret.style.top = (rect.top - textDisplayRect.top) + 'px';
        }
    }
}
