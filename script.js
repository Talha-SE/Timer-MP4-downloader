/*
 * Creative Commons Attribution 4.0 International License (CC BY 4.0)
 * Copyright (c) 2025 Talha
 * See LICENSE file for details
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize timer and customizer
    window.timer = new Timer();
    const customizer = new TimerCustomizer();
    const recorder = new TimerRecorder();
    
    // Store reference to recorder in the window object as well
    window.recorder = recorder;
    
    // Populate default values if needed
    if (document.getElementById('minutes').value === '0') {
        document.getElementById('minutes').value = Config.defaultTimer.minutes;
    }
    
    // Update timer display with initial values
    window.timer.updateInitialDisplay();
    
    // Add input event listeners to update display when timer inputs change
    document.getElementById('hours').addEventListener('input', () => window.timer.updateInitialDisplay());
    document.getElementById('minutes').addEventListener('input', () => window.timer.updateInitialDisplay());
    document.getElementById('seconds').addEventListener('input', () => window.timer.updateInitialDisplay());
    
    // Preview visibility toggle
    const showPreviewCheckbox = document.getElementById('show-preview');
    const previewArea = document.getElementById('preview-area');

    showPreviewCheckbox.addEventListener('change', function() {
        if (this.checked) {
            previewArea.classList.add('active');
        } else {
            previewArea.classList.remove('active');
        }
    });

    // Preview visibility toggle with size adjustment
    const previewCanvas = document.getElementById('preview-canvas');
    const qualitySelect = document.getElementById('video-quality');

    showPreviewCheckbox.addEventListener('change', function() {
        if (this.checked) {
            previewArea.classList.add('active');
            updatePreviewSize();
        } else {
            previewArea.classList.remove('active');
        }
    });

    // Function to update preview size based on selected quality
    function updatePreviewSize() {
        if (!showPreviewCheckbox.checked) return;
        
        const selectedQuality = qualitySelect.value;
        let width, height;
        
        switch(selectedQuality) {
            case '720p':
                width = 1280; height = 720;
                break;
            case '1080p':
                width = 1920; height = 1080;
                break;
            case '2160p':
                width = 3840; height = 2160;
                break;
            default:
                width = 1280; height = 720;
        }
        
        // Keep preview at reasonable size
        const maxPreviewWidth = 400;
        const scale = Math.min(1, maxPreviewWidth / width);
        previewCanvas.width = width * scale;
        previewCanvas.height = height * scale;
    }

    // Update preview when quality changes
    qualitySelect.addEventListener('change', updatePreviewSize);

    console.log('Timer app initialized');
});
