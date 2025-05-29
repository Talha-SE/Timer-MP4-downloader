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
    
    console.log('Timer app initialized');
});
