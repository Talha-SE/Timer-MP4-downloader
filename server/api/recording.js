const express = require('express');
const router = express.Router();
const recordingService = require('../recordingService');
const path = require('path');
const fs = require('fs');

// Start a new recording
router.post('/start', (req, res) => {
    try {
        const options = {
            width: req.body.width || 1280,
            height: req.body.height || 720,
            transparentBg: req.body.transparentBg || false,
            quality: req.body.quality || 'medium'
        };
        
        const sessionId = recordingService.startRecording(options);
        
        res.json({
            success: true,
            sessionId: sessionId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add a frame to the recording
router.post('/frame', (req, res) => {
    try {
        const { sessionId, frameData } = req.body;
        
        if (!sessionId || !frameData) {
            return res.status(400).json({
                success: false,
                error: 'Missing sessionId or frameData'
            });
        }
        
        recordingService.addFrame(sessionId, frameData);
        
        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop recording and get video URL
router.post('/stop', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Missing sessionId'
            });
        }
        
        const videoPath = await recordingService.stopRecording(sessionId);
        const videoUrl = `/recordings/${path.basename(videoPath)}`;
        
        res.json({
            success: true,
            videoUrl: videoUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download a video file
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../recordings', filename);
    
    // Validate that the file exists and is within the recordings directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(path.join(__dirname, '../../recordings'))) {
        return res.status(404).json({
            success: false,
            error: 'File not found'
        });
    }
    
    res.download(filePath);
});

module.exports = router;
