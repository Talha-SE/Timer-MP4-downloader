const Utils = {
    // Add leading zero if needed
    padZero: function(num) {
        return num.toString().padStart(2, '0');
    },
    
    // Format time in seconds to HH:MM:SS
    formatTime: function(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
    },
    
    // Parse time string (HH:MM:SS) to seconds
    parseTimeToSeconds: function(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }
};
