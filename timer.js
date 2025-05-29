class Timer {
    constructor() {
        // DOM elements
        this.timerDisplay = document.getElementById('timer-display');
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.secondsInput = document.getElementById('seconds');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Timer state
        this.totalSeconds = 0;
        this.isRunning = false;
        this.timer = null;
        
        // Initialize
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    updateInitialDisplay() {
        // Get time from inputs
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        
        // Update display with initial values
        this.timerDisplay.textContent = `${Utils.padZero(hours)}:${Utils.padZero(minutes)}:${Utils.padZero(seconds)}`;
    }
    
    updateTimerDisplay() {
        const hours = Math.floor(this.totalSeconds / 3600);
        const minutes = Math.floor((this.totalSeconds % 3600) / 60);
        const seconds = this.totalSeconds % 60;
        
        this.timerDisplay.textContent = `${Utils.padZero(hours)}:${Utils.padZero(minutes)}:${Utils.padZero(seconds)}`;
    }
    
    startTimer() {
        if (this.isRunning) return;
        
        // Get time from inputs if timer is not already set
        if (this.totalSeconds === 0) {
            const hours = parseInt(this.hoursInput.value) || 0;
            const minutes = parseInt(this.minutesInput.value) || 0;
            const seconds = parseInt(this.secondsInput.value) || 0;
            
            this.totalSeconds = hours * 3600 + minutes * 60 + seconds;
            
            if (this.totalSeconds === 0) return; // Don't start if no time is set
        }
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.timer = setInterval(() => {
            this.totalSeconds--;
            this.updateTimerDisplay();
            
            if (this.totalSeconds <= 0) {
                // Ensure display shows 00:00:00
                this.totalSeconds = 0;
                this.updateTimerDisplay();
                
                // Clear interval first to prevent any further ticks
                clearInterval(this.timer);
                
                // Set a short timeout to ensure the 00:00:00 gets recorded
                setTimeout(() => {
                    this.isRunning = false;
                    this.startBtn.disabled = false;
                    this.pauseBtn.disabled = true;
                    
                    // Stop recording if it's in progress and trigger download
                    const recorder = document.querySelector('body').__recorder;
                    if (recorder && recorder.isRecording) {
                        recorder.stopRecording(true); // Pass true to auto-download when complete
                    }
                }, 500); // Half-second delay to ensure 00:00:00 is captured
            }
        }, 1000);
    }
    
    pauseTimer() {
        if (!this.isRunning) return;
        
        clearInterval(this.timer);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    resetTimer() {
        clearInterval(this.timer);
        this.totalSeconds = 0;
        this.isRunning = false;
        
        // Clear inputs
        this.hoursInput.value = 0;
        this.minutesInput.value = 0;
        this.secondsInput.value = 0;
        
        // Update display to show 00:00:00
        this.timerDisplay.textContent = "00:00:00";
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    stopTimer() {
        clearInterval(this.timer);
        this.totalSeconds = 0;
        this.updateTimerDisplay(); // Ensure display shows 00:00:00
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
}
