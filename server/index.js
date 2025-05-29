const express = require('express');
const cors = require('cors');
const app = express();
const recordingRoutes = require('./api/recording');
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for frame data
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/api/recording', recordingRoutes);

// Serve recordings (with proper security measures)
app.use('/recordings', (req, res, next) => {
    // Only allow downloading with proper token/session validation
    // This is simplified; implement proper auth in production
    if (req.query.token === 'valid-download-token') {
        express.static(path.join(__dirname, '../recordings'))(req, res, next);
    } else {
        res.status(403).send('Unauthorized');
    }
});

// Serve main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
