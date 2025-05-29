class TimerCustomizer {
    constructor() {
        this.timerDisplay = document.getElementById('timer-display');
        this.fontSelect = document.getElementById('font-select');
        this.timerColor = document.getElementById('timer-color');
        this.backgroundColor = document.getElementById('background-color');
        this.themeSelect = document.getElementById('theme-select');
        
        this.initEventListeners();
        this.loadSavedCustomization();
    }
    
    initEventListeners() {
        this.fontSelect.addEventListener('change', () => this.updateTimerStyle());
        this.timerColor.addEventListener('change', () => this.updateTimerStyle());
        this.backgroundColor.addEventListener('change', () => this.updateTimerStyle());
        
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => this.applyTheme(e.target.value));
        }
    }
    
    updateTimerStyle() {
        this.timerDisplay.style.fontFamily = this.fontSelect.value;
        this.timerDisplay.style.color = this.timerColor.value;
        this.timerDisplay.style.backgroundColor = this.backgroundColor.value;
        
        // Save customization
        this.saveCustomization();
    }
    
    applyTheme(themeName) {
        document.body.className = themeName;
        
        // Update color pickers based on theme
        if (themeName === 'theme-dark') {
            this.timerColor.value = '#f0f0f0';
            this.backgroundColor.value = '#1a1a1a';
        } else if (themeName === 'theme-light') {
            this.timerColor.value = '#333333';
            this.backgroundColor.value = '#f4f4f4';
        } else if (themeName === 'theme-ocean') {
            this.timerColor.value = '#006064';
            this.backgroundColor.value = '#b2ebf2';
        } else if (themeName === 'theme-sunset') {
            this.timerColor.value = '#e65100';
            this.backgroundColor.value = '#ffe0b2';
        }
        
        this.updateTimerStyle();
    }
    
    saveCustomization() {
        const customization = {
            font: this.fontSelect.value,
            timerColor: this.timerColor.value,
            backgroundColor: this.backgroundColor.value,
            theme: document.body.className || 'theme-light'
        };
        
        localStorage.setItem('timerCustomization', JSON.stringify(customization));
    }
    
    loadSavedCustomization() {
        const saved = localStorage.getItem('timerCustomization');
        
        if (saved) {
            const customization = JSON.parse(saved);
            
            this.fontSelect.value = customization.font;
            this.timerColor.value = customization.timerColor;
            this.backgroundColor.value = customization.backgroundColor;
            
            if (this.themeSelect) {
                this.themeSelect.value = customization.theme;
            }
            
            document.body.className = customization.theme;
            this.updateTimerStyle();
        }
    }
}
