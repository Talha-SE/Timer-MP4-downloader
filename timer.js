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
        this.updateTimerDisplay();
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
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
                this.stopTimer();
                alert("Timer finished!");
                
                // Stop recording if it's in progress
                const recorder = document.querySelector('body').__recorder;
                if (recorder && recorder.isRecording) {
                    recorder.stopRecording();
                }
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
        this.updateTimerDisplay();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Clear inputs
        this.hoursInput.value = 0;
        this.minutesInput.value = 0;
        this.secondsInput.value = 0;
    }
    
    stopTimer() {
        clearInterval(this.timer);
        this.totalSeconds = 0;
        this.isRunning = false;
        this.updateTimerDisplay();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
}
