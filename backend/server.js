const express = require('express');
const cors = require('cors');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// SPA fallback must be BEFORE static
app.use(history({
    verbose: false,
    rewrites: [
        { from: /^\/api\/.*$/, to: context => context.parsedUrl.path }
    ]
}));

// Serve static files AFTER fallback
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.get('/api/health', (req, res) => {
    res.send('Backend server is healthy!');
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'fake-jwt-token-for-demo' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});