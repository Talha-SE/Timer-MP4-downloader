class TimerRecorder {
    constructor() {
        // DOM Elements
        this.recordBtn = document.getElementById('record-btn');
        this.stopRecordBtn = document.getElementById('stop-record-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.recordingStatus = document.getElementById('recording-status');
        this.videoQuality = document.getElementById('video-quality');
        this.transparentBg = document.getElementById('transparent-bg');
        this.showPreview = document.getElementById('show-preview');
        this.previewArea = document.getElementById('preview-area');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.timerDisplay = document.getElementById('timer-display');
        this.canvas = document.getElementById('recording-canvas');
        
        // Recording state
        this.isRecording = false;
        this.sessionId = null;
        this.videoUrl = null;
        this.autoDownload = false;
        this.previewCtx = null;
        this.lastTimerValue = "00:00:00";
        this.frameCount = 0;
        this.frameInterval = null;
        
        // API endpoints
        this.apiEndpoints = {
            start: '/api/recording/start',
            frame: '/api/recording/frame',
            stop: '/api/recording/stop',
            download: '/api/recording/download'
        };
        
        // Store reference to this recorder instance for global access
        document.querySelector('body').__recorder = this;
        
        // Initialize
        this.initCanvas();
        this.initPreview();
        this.initEventListeners();
    }
    
    initCanvas() {
        this.ctx = this.canvas.getContext('2d');
    }
    
    initPreview() {
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // Initialize preview with default quality
        this.updateCanvasSize();
        
        // Set initial preview state
        if (this.showPreview.checked) {
            this.previewArea.classList.add('active');
            this.startPreviewLoop();
        }
    }
    
    initEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordBtn.addEventListener('click', () => this.stopRecording());
        this.downloadBtn.addEventListener('click', () => this.downloadVideo());
        this.videoQuality.addEventListener('change', () => this.updateCanvasSize());
        this.transparentBg.addEventListener('change', () => this.updatePreview());
        this.showPreview.addEventListener('change', () => this.togglePreview());
        
        // Update canvas size when quality changes
        this.updateCanvasSize();
    }
    
    togglePreview() {
        if (this.showPreview.checked) {
            this.previewArea.classList.add('active');
            this.startPreviewLoop();
        } else {
            this.previewArea.classList.remove('active');
            // Stop preview loop if it's running
            if (this.previewLoopId) {
                cancelAnimationFrame(this.previewLoopId);
                this.previewLoopId = null;
            }
        }
    }
    
    startPreviewLoop() {
        const loop = () => {
            this.updatePreview();
            this.previewLoopId = requestAnimationFrame(loop);
        };
        this.previewLoopId = requestAnimationFrame(loop);
    }
    
    updatePreview() {
        // Draw the current timer state to the canvas
        this.drawTimerToCanvas();
        
        // Copy the main canvas to the preview canvas, scaling it down
        this.previewCanvas.width = this.canvas.width / 4;
        this.previewCanvas.height = this.canvas.height / 4;
        this.previewCtx.drawImage(this.canvas, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }
    
    updateCanvasSize() {
        const quality = this.videoQuality.value;
        let width, height;
        
        switch(quality) {
            case '720p':
                width = 1280;
                height = 720;
                break;
            case '1080p':
                width = 1920;
                height = 1080;
                break;
            case '2k':
                width = 2560;
                height = 1440;
                break;
            case '4k':
                width = 3840;
                height = 2160;
                break;
            default:
                width = 1280;
                height = 720;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Update preview if it exists
        if (this.previewCtx) {
            this.previewCanvas.width = width / 4;
            this.previewCanvas.height = height / 4;
            this.updatePreview();
        }
    }
    
    drawTimerToCanvas() {
        // Get timer display style
        const timerStyle = window.getComputedStyle(this.timerDisplay);
        const timerText = this.timerDisplay.textContent;
        
        // Track if the timer value has changed
        const timerChanged = this.lastTimerValue !== timerText;
        this.lastTimerValue = timerText;
        
        // Clear canvas with transparency
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // If transparent background is not selected, fill background
        if (!this.transparentBg || !this.transparentBg.checked) {
            this.ctx.fillStyle = timerStyle.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Calculate font size based on canvas dimensions
        const fontSize = Math.min(this.canvas.width / 8, this.canvas.height / 3);
        
        // Draw timer text
        this.ctx.font = `${fontSize}px ${timerStyle.fontFamily}`;
        this.ctx.fillStyle = timerStyle.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(timerText, this.canvas.width / 2, this.canvas.height / 2);
        
        // If recording, add a recording indicator (small red dot)
        if (this.isRecording) {
            const dotSize = Math.min(this.canvas.width, this.canvas.height) * 0.02;
            this.ctx.fillStyle = 'rgba(255, 0, 0, ' + (0.5 + Math.sin(this.frameCount * 0.1) * 0.5) + ')';
            this.ctx.beginPath();
            this.ctx.arc(dotSize * 2, dotSize * 2, dotSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.frameCount++;
        }
    }
    
    async startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.frameCount = 0;
        
        // Update UI
        this.recordBtn.disabled = true;
        this.stopRecordBtn.disabled = false;
        this.downloadBtn.disabled = true;
        this.recordingStatus.textContent = 'Recording in progress...';
        this.recordingStatus.classList.add('recording');
        
        // Start the timer if it's not running
        if (!window.timer.isRunning) {
            window.timer.startTimer();
        }
        
        try {
            // Get canvas dimensions from quality setting
            const quality = this.videoQuality.value;
            const dimensions = this.getCanvasDimensions(quality);
            
            // Start recording on server
            const response = await fetch(this.apiEndpoints.start, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    width: dimensions.width,
                    height: dimensions.height,
                    transparentBg: this.transparentBg.checked,
                    quality: 'medium' // Can be configurable
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to start recording on server');
            }
            
            this.sessionId = data.sessionId;
            
            // Start sending frames to the server
            this.startFrameCapture();
            
            // Start the canvas rendering loop
            this.renderLoop();
        } catch (error) {
            console.error('Error starting recording:', error);
            this.recordingStatus.textContent = 'Failed to start recording: ' + error.message;
            this.resetRecordingUI();
        }
    }
    
    getCanvasDimensions(quality) {
        switch(quality) {
            case '720p': return { width: 1280, height: 720 };
            case '1080p': return { width: 1920, height: 1080 };
            case '2k': return { width: 2560, height: 1440 };
            case '4k': return { width: 3840, height: 2160 };
            default: return { width: 1280, height: 720 };
        }
    }
    
    startFrameCapture() {
        // Capture frames at a consistent rate (e.g., 10 FPS for efficiency)
        const FRAME_RATE = 10;
        this.frameInterval = setInterval(() => {
            if (!this.isRecording || !this.sessionId) {
                clearInterval(this.frameInterval);
                return;
            }
            
            this.sendFrameToServer();
        }, 1000 / FRAME_RATE);
    }
    
    async sendFrameToServer() {
        try {
            // Draw the current state to the canvas
            this.drawTimerToCanvas();
            
            // Get frame as base64 data URL
            const frameData = this.canvas.toDataURL('image/png');
            
            // Send frame to server
            await fetch(this.apiEndpoints.frame, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    frameData
                }),
            });
        } catch (error) {
            console.error('Error sending frame:', error);
        }
    }
    
    renderLoop() {
        if (!this.isRecording) return;
        
        // Draw the timer to the canvas
        this.drawTimerToCanvas();
        
        // Continue the loop
        requestAnimationFrame(() => this.renderLoop());
    }
    
    async stopRecording(autoDownload = false) {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.autoDownload = autoDownload;
        
        // Clear frame capture interval
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
        }
        
        // Update UI to show processing state
        this.recordingStatus.textContent = 'Processing video on server...';
        
        try {
            // Tell server to stop recording and generate video
            const response = await fetch(this.apiEndpoints.stop, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to process video on server');
            }
            
            // Store video URL for download
            this.videoUrl = data.videoUrl;
            
            // Update UI
            this.recordBtn.disabled = false;
            this.stopRecordBtn.disabled = true;
            this.downloadBtn.disabled = false;
            this.recordingStatus.textContent = 'Recording complete. Ready to download.';
            this.recordingStatus.classList.remove('recording');
            
            // Auto download if requested
            if (this.autoDownload) {
                this.downloadVideo();
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.recordingStatus.textContent = 'Error processing video: ' + error.message;
            this.resetRecordingUI();
        }
    }
    
    downloadVideo() {
        if (!this.videoUrl) return;
        
        // Add token for download authorization
        const downloadUrl = `${this.videoUrl}?token=valid-download-token`;
        
        // Create download link
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        
        // Set filename based on current date
        const extension = this.transparentBg.checked ? 'webm' : 'mp4';
        a.download = `timer-${new Date().toISOString()}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            
            // Show success message
            this.showDownloadSuccess();
        }, 100);
    }
    
    // Add method to create a custom success message
    showDownloadSuccess() {
        // Create success message element
        const successMsg = document.createElement('div');
        successMsg.className = 'download-success-message';
        successMsg.innerHTML = `
            <div class="success-content">
                <div class="success-icon">✓</div>
                <div class="success-text">Download successful!</div>
                <button class="close-btn">OK</button>
            </div>
        `;
        document.body.appendChild(successMsg);
        
        // Add close button functionality
        const closeBtn = successMsg.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(successMsg);
        });
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (document.body.contains(successMsg)) {
                document.body.removeChild(successMsg);
            }
        }, 4000);
    }
    
    resetRecordingUI() {
        this.isRecording = false;
        this.recordBtn.disabled = false;
        this.stopRecordBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.recordingStatus.classList.remove('recording');
    }
}
