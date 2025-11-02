// Theme management
const themeButton = document.getElementById('theme-button');
const themeDropdown = document.getElementById('theme-dropdown');
let currentTheme = localStorage.getItem('theme') || 'serika-dark';

// Apply saved theme on load
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
        
        // Redraw graph with new theme colors
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

// Display results
if (results.wpm !== undefined) {
    document.getElementById('result-wpm').textContent = results.wpm;
    document.getElementById('result-accuracy').textContent = results.accuracy + '%';
    document.getElementById('result-errors').textContent = results.errorRate + '%';
    document.getElementById('result-time').textContent = results.time + 's';
    document.getElementById('result-chars').textContent = results.totalChars;
    document.getElementById('result-correct').textContent = results.correctChars;
    document.getElementById('result-incorrect').textContent = results.incorrectChars;
}

// Draw performance graph
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
    const padding = 50;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Draw grid
    ctx.strokeStyle = textSecondary;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (graphHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Draw line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
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
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw axis labels
    ctx.fillStyle = textPrimary;
    ctx.font = '12px Roboto Mono';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
        const wpm = Math.round((maxWPM / 5) * (5 - i));
        const y = padding + (graphHeight / 5) * i + 4;
        ctx.fillText(wpm + ' wpm', padding - 10, y);
    }
    
    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillStyle = textSecondary;
    ctx.fillText('Time (seconds)', width / 2, height - 10);
}

drawGraph();

// Button handlers
document.getElementById('try-again').addEventListener('click', function() {
    window.location.href = 'index.html';
});

document.getElementById('go-home').addEventListener('click', function() {
    window.location.href = 'index.html';
});
