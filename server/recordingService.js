const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Directory to store recordings
const RECORDINGS_DIR = path.join(__dirname, '../recordings');

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

class RecordingService {
    constructor() {
        this.activeRecordings = new Map();
        this.frameRate = 30; // Default frame rate
    }

    // Start a new recording session
    startRecording(options = {}) {
        const sessionId = uuidv4();
        const {
            width = 1280,
            height = 720,
            transparentBg = false,
            quality = 'medium'
        } = options;
        
        const outputFormat = transparentBg ? 'webm' : 'mp4';
        const outputPath = path.join(RECORDINGS_DIR, `${sessionId}.${outputFormat}`);
        
        // Create a new ffmpeg command for this recording
        const command = ffmpeg()
            .size(`${width}x${height}`)
            .fps(this.frameRate)
            .videoCodec(transparentBg ? 'libvpx-vp9' : 'libx264')
            .videoBitrate(this.getBitrate(width, height, quality))
            .outputOptions(transparentBg ? ['-pix_fmt', 'yuva420p'] : [])
            .output(outputPath);
        
        // Store recording info
        this.activeRecordings.set(sessionId, {
            command,
            frames: [],
            outputPath,
            options,
            startTime: Date.now()
        });
        
        return sessionId;
    }
    
    // Add a frame to the recording
    addFrame(sessionId, frameData) {
        const recording = this.activeRecordings.get(sessionId);
        if (!recording) {
            throw new Error(`No active recording with ID: ${sessionId}`);
        }
        
        // Convert base64 frame data to buffer and add to frames
        const imageBuffer = Buffer.from(
            frameData.replace(/^data:image\/\w+;base64,/, ''),
            'base64'
        );
        
        recording.frames.push({
            data: imageBuffer,
            timestamp: Date.now() - recording.startTime
        });
        
        return true;
    }
    
    // Stop recording and process video
    async stopRecording(sessionId) {
        const recording = this.activeRecordings.get(sessionId);
        if (!recording) {
            throw new Error(`No active recording with ID: ${sessionId}`);
        }
        
        // Process frames into video file
        await this.processFrames(recording);
        
        // Remove from active recordings
        this.activeRecordings.delete(sessionId);
        
        // Return path to the video file
        return recording.outputPath;
    }
    
    // Process frames into a video file using ffmpeg
    async processFrames(recording) {
        return new Promise((resolve, reject) => {
            // Create temp directory for frames
            const tempDir = path.join(RECORDINGS_DIR, `temp_${path.basename(recording.outputPath, path.extname(recording.outputPath))}`);
            
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Write frames to temp directory
            recording.frames.forEach((frame, index) => {
                const framePath = path.join(tempDir, `frame_${index.toString().padStart(6, '0')}.png`);
                fs.writeFileSync(framePath, frame.data);
            });
            
            // Use ffmpeg to create video from frames
            ffmpeg()
                .input(path.join(tempDir, 'frame_%06d.png'))
                .inputFPS(this.frameRate)
                .videoCodec(recording.options.transparentBg ? 'libvpx-vp9' : 'libx264')
                .videoBitrate(this.getBitrate(recording.options.width, recording.options.height, recording.options.quality))
                .outputOptions(recording.options.transparentBg ? ['-pix_fmt', 'yuva420p'] : [])
                .output(recording.outputPath)
                .on('end', () => {
                    // Clean up temp directory
                    fs.rm(tempDir, { recursive: true }, (err) => {
                        if (err) console.error('Error removing temp directory:', err);
                    });
                    resolve(recording.outputPath);
                })
                .on('error', (err) => {
                    reject(err);
                })
                .run();
        });
    }
    
    // Helper to determine appropriate bitrate based on resolution and quality
    getBitrate(width, height, quality) {
        const pixels = width * height;
        let baseBitrate;
        
        if (pixels <= 921600) { // 720p
            baseBitrate = 2500;
        } else if (pixels <= 2073600) { // 1080p
            baseBitrate = 5000;
        } else if (pixels <= 3686400) { // 2K
            baseBitrate = 8000;
        } else { // 4K
            baseBitrate = 16000;
        }
        
        const qualityMultiplier = {
            low: 0.7,
            medium: 1.0,
            high: 1.5
        };
        
        return Math.floor(baseBitrate * (qualityMultiplier[quality] || 1.0));
    }
}

module.exports = new RecordingService();
