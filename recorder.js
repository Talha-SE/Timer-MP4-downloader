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
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.videoBlob = null;
        this.autoDownload = false;
        this.previewCtx = null;
        this.lastTimerValue = "00:00:00";
        this.frameCount = 0;
        
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
        
        // Track if the timer value has changed (for forced keyframes)
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
            
            // Force a keyframe when the timer changes
            if (timerChanged && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                try {
                    // Request a keyframe to ensure precise timing
                    this.mediaRecorder.requestData();
                } catch (e) {
                    // Some browsers may not support this
                    console.log('Could not request keyframe');
                }
            }
        }
    }
    
    startRecording() {
        if (this.isRecording) return;
        
        this.recordedChunks = [];
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
        
        // Setup canvas stream with higher framerate (60 FPS) for smoother timer
        const stream = this.canvas.captureStream(60);
        
        // Create media recorder with appropriate settings based on transparency
        let options;
        
        if (this.transparentBg.checked) {
            // For transparency, we need to use WebM with VP8/VP9 codec
            options = { mimeType: 'video/webm;codecs=vp9' };
        } else {
            // For non-transparent, we can use more compatible formats
            options = { mimeType: 'video/webm;codecs=vp9' }; // Default to WebM
        }
        
        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            // Fallback if vp9 is not supported
            try {
                this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            } catch (e) {
                console.error('MediaRecorder not supported by this browser', e);
                this.recordingStatus.textContent = 'Recording not supported by your browser';
                this.resetRecordingUI();
                return;
            }
        }
        
        // Set up media recorder events
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            // Create appropriate blob type based on transparency
            const mimeType = this.transparentBg.checked ? 'video/webm' : 'video/mp4';
            this.videoBlob = new Blob(this.recordedChunks, { type: mimeType });
            this.downloadBtn.disabled = false;
            this.recordingStatus.textContent = 'Recording complete. Ready to download.';
            this.recordingStatus.classList.remove('recording');
            
            // Auto download if requested
            if (this.autoDownload) {
                // Small delay before triggering download to ensure processing is complete
                setTimeout(() => this.downloadVideo(), 300);
            }
        };
        
        // Start recording - use smaller timeslice (100ms) for more accurate timing
        this.mediaRecorder.start(100);
        
        // Start the canvas rendering loop
        this.renderLoop();
    }
    
    renderLoop() {
        if (!this.isRecording) return;
        
        // Draw the timer to the canvas
        this.drawTimerToCanvas();
        
        // Continue the loop
        requestAnimationFrame(() => this.renderLoop());
    }
    
    stopRecording(autoDownload = false) {
        if (!this.isRunning) return;
        
        this.isRecording = false;
        this.autoDownload = autoDownload;
        
        // Make sure we record one final frame with the final timer value
        this.drawTimerToCanvas();
        
        // Small delay to ensure the final frame is captured
        setTimeout(() => {
            this.mediaRecorder.stop();
            
            // Update UI
            this.recordBtn.disabled = false;
            this.stopRecordBtn.disabled = true;
        }, 200);
    }
    
    downloadVideo() {
        if (!this.videoBlob) return;
        
        const url = URL.createObjectURL(this.videoBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Set extension based on transparency
        const extension = this.transparentBg.checked ? 'webm' : 'mp4';
        a.download = `timer-${new Date().toISOString()}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
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
