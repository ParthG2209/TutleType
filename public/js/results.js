// Theme management
const themeButton = document.getElementById('theme-button');
const themeDropdown = document.getElementById('theme-dropdown');
let currentTheme = localStorage.getItem('theme') || 'serika-dark';

document.body.className = `theme-${currentTheme} min-h-screen`;
updateActiveTheme(currentTheme);

themeButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    themeDropdown.classList.toggle('hidden');
    themeDropdown.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('#theme-button') && !e.target.closest('#theme-dropdown')) {
        themeDropdown.classList.add('hidden');
        themeDropdown.classList.remove('show');
    }
});

document.querySelectorAll('.theme-option').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const theme = this.getAttribute('data-theme');
        document.body.className = `theme-${theme} min-h-screen`;
        localStorage.setItem('theme', theme);
        currentTheme = theme;
        updateActiveTheme(theme);
        themeDropdown.classList.add('hidden');
        themeDropdown.classList.remove('show');
        drawGraph();
    });
});

function updateActiveTheme(theme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        }
    });
}

// Get results from localStorage
const results = JSON.parse(localStorage.getItem('testResults') || '{}');

// Save current test to history
function saveToHistory() {
    let history = JSON.parse(localStorage.getItem('testHistory') || '[]');
    const testRecord = {
        wpm: results.wpm,
        accuracy: results.accuracy,
        errorRate: results.errorRate,
        time: results.time,
        totalChars: results.totalChars,
        correctChars: results.correctChars,
        incorrectChars: results.incorrectChars,
        rawWpm: calculateRawWPM(),
        consistency: calculateConsistency(),
        peakWpm: calculatePeakWPM(),
        timestamp: new Date().toISOString()
    };

    history.unshift(testRecord);
    
    if (history.length > 50) {
        history = history.slice(0, 50);
    }

    localStorage.setItem('testHistory', JSON.stringify(history));
}

// Calculate additional metrics
function calculateRawWPM() {
    if (!results.time || results.time === 0) return 0;
    const timeInMinutes = results.time / 60;
    const totalCharsTyped = results.totalChars || 0;
    const rawWords = totalCharsTyped / 5;
    return Math.round(rawWords / timeInMinutes);
}

function calculateConsistency() {
    if (!results.wpmHistory || results.wpmHistory.length < 2) return 100;
    const avg = results.wpmHistory.reduce((a, b) => a + b, 0) / results.wpmHistory.length;
    const variance = results.wpmHistory.reduce((sum, wpm) => {
        return sum + Math.pow(wpm - avg, 2);
    }, 0) / results.wpmHistory.length;
    const stdDev = Math.sqrt(variance);
    const consistency = 100 - ((stdDev / avg) * 100);
    return Math.max(0, Math.min(100, Math.round(consistency)));
}

function calculatePeakWPM() {
    if (!results.wpmHistory || results.wpmHistory.length === 0) return 0;
    return Math.max(...results.wpmHistory);
}

// Display results
if (results.wpm !== undefined) {
    document.getElementById('result-wpm').textContent = results.wpm;
    document.getElementById('result-accuracy').textContent = results.accuracy + '%';
    document.getElementById('result-errors').textContent = results.errorRate + '%';
    document.getElementById('result-time').textContent = results.time + 's';
    document.getElementById('result-chars').textContent = results.totalChars;
    document.getElementById('result-correct').textContent = results.correctChars;
    document.getElementById('result-incorrect').textContent = results.incorrectChars;
    document.getElementById('result-raw-wpm').textContent = calculateRawWPM();
    document.getElementById('result-consistency').textContent = calculateConsistency() + '%';
    document.getElementById('result-peak-wpm').textContent = calculatePeakWPM();
    
    saveToHistory();
}

function drawGraph() {
    const canvas = document.getElementById('performance-graph');
    if (!canvas || !results.wpmHistory || results.wpmHistory.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-color').trim();
    const textSecondary = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-secondary').trim();
    const textPrimary = getComputedStyle(document.documentElement)
        .getPropertyValue('--text-primary').trim();
    
    const maxWPM = Math.max(...results.wpmHistory, 10);
    const padding = 45;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Draw grid
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
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    results.wpmHistory.forEach((wpm, index) => {
        const x = padding + (graphWidth / (results.wpmHistory.length - 1)) * index;
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
    results.wpmHistory.forEach((wpm, index) => {
        const x = padding + (graphWidth / (results.wpmHistory.length - 1)) * index;
        const y = padding + graphHeight - (wpm / maxWPM) * graphHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw Y-axis labels
    ctx.fillStyle = textSecondary;
    ctx.font = '10px Roboto Mono';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
        const wpm = Math.round((maxWPM / 4) * (4 - i));
        const y = padding + (graphHeight / 4) * i + 3;
        ctx.fillText(wpm, padding - 10, y);
    }
    
    // Y-axis label
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = textPrimary;
    ctx.font = '11px Roboto Mono';
    ctx.fillText('words per minute', 0, 0);
    ctx.restore();
    
    // X-axis label
    ctx.textAlign = 'right';
    ctx.fillStyle = textPrimary;
    ctx.font = '11px Roboto Mono';
    ctx.fillText('time', width - padding, height - 10);
}

drawGraph();

document.getElementById('screenshot-btn').addEventListener('click', function() {
    if (typeof html2canvas === 'undefined') {
        alert('html2canvas library not loaded yet. Try again in a moment.');
        return;
    }
    
    html2canvas(document.querySelector('.results-container') || document.body).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'tutletype-results-' + new Date().getTime() + '.png';
        link.click();
    }).catch(err => {
        alert('Failed to take screenshot: ' + err.message);
    });
});


// Compare functionality
document.getElementById('compare-btn').addEventListener('click', function() {
    const comparisonSection = document.getElementById('comparison-section');
    const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
    
    if (comparisonSection.classList.contains('show')) {
        comparisonSection.classList.remove('show');
        return;
    }
    
    if (history.length < 2) {
        alert('Not enough test history to compare. Complete at least 2 tests!');
        return;
    }
    
    const last10 = history.slice(1, 11);
    
    if (last10.length === 0) {
        alert('No previous tests to compare!');
        return;
    }
    
    const avgWpm = last10.reduce((sum, test) => sum + test.wpm, 0) / last10.length;
    const avgAcc = last10.reduce((sum, test) => sum + test.accuracy, 0) / last10.length;
    
    const wpmChange = results.wpm - avgWpm;
    const accChange = results.accuracy - avgAcc;
    
    const wpmChangeEl = document.getElementById('wpm-change');
    const accChangeEl = document.getElementById('acc-change');
    
    wpmChangeEl.textContent = (wpmChange > 0 ? '+' : '') + wpmChange.toFixed(1);
    wpmChangeEl.className = 'comparison-value ' + (wpmChange > 0 ? 'positive' : wpmChange < 0 ? 'negative' : 'neutral');
    
    accChangeEl.textContent = (accChange > 0 ? '+' : '') + accChange.toFixed(1) + '%';
    accChangeEl.className = 'comparison-value ' + (accChange > 0 ? 'positive' : accChange < 0 ? 'negative' : 'neutral');
    
    comparisonSection.classList.remove('hidden');
    comparisonSection.classList.add('show');
});

// History button
document.getElementById('history-btn').addEventListener('click', function() {
    const historySection = document.getElementById('history-section');
    const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
    
    if (historySection.classList.contains('show')) {
        historySection.classList.remove('show');
        setTimeout(() => {
            historySection.style.display = 'none';
        }, 300);
        return;
    }
    
    if (history.length === 0) {
        alert('No test history yet. Complete some tests first!');
        return;
    }
    
    // Build history list
    const last10 = history.slice(0, 10);
    let historyHTML = '';
    
    last10.forEach((test, index) => {
        historyHTML += `
            <div style="padding: 10px; border-bottom: 1px solid #ccc; margin-bottom: 5px;">
                <div><strong>Test ${index + 1}</strong></div>
                <div>WPM: <span style="color: var(--accent-color);">${test.wpm}</span> | 
                     Accuracy: <span>${test.accuracy}%</span> | 
                     Time: <span>${test.time}s</span></div>
            </div>
        `;
    });
    
    document.getElementById('history-list').innerHTML = historyHTML;
    
    // Show with animation
    historySection.style.display = 'block';
    historySection.classList.remove('hidden');
    setTimeout(() => {
        historySection.classList.add('show');
    }, 10);
});



// Try again button
document.getElementById('try-again').addEventListener('click', function() {
    
window.location.href = './index.html'
});
