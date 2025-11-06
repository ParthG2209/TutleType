// Shared theme management across all pages
// Save this as: public/js/theme-manager.js

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'serika-dark';
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        if (!document.body.classList.contains('min-h-screen')) {
            document.body.classList.add('min-h-screen');
        }
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        
        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    updateActiveTheme(theme) {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-theme') === theme) {
                btn.classList.add('active');
            }
        });
    }

    initializeThemeSelector() {
        const themeButton = document.getElementById('theme-button');
        const themeDropdown = document.getElementById('theme-dropdown');
        
        if (!themeButton || !themeDropdown) return;

        // Update active theme in dropdown
        this.updateActiveTheme(this.currentTheme);

        // Toggle dropdown
        themeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            themeDropdown.classList.toggle('hidden');
            themeDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#theme-button') && !e.target.closest('#theme-dropdown')) {
                themeDropdown.classList.add('hidden');
                themeDropdown.classList.remove('show');
            }
        });

        // Theme option click handlers
        document.querySelectorAll('.theme-option').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const theme = button.getAttribute('data-theme');
                this.applyTheme(theme);
                this.updateActiveTheme(theme);
                themeDropdown.classList.add('hidden');
                themeDropdown.classList.remove('show');
                
                // Refocus input if on main page
                const userInput = document.getElementById('user-input');
                if (userInput && window.typingEngine) {
                    setTimeout(() => {
                        userInput.focus();
                        typingEngine.updateCaret();
                    }, 100);
                }
            });
        });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// Initialize on load
window.themeManager = new ThemeManager();