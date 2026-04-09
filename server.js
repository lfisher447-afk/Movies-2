const http = require('http');
const { createServer } = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
const express = require('express');
const cluster = require('cluster');
const os = require('os');
const cors = require('cors');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const app = express();
    const server = createServer(app);
    const io = new Server(server);

    // Enable CORS 
    app.use(cors());
    // Use compression middleware
    app.use(compression());
    
    // Caching middleware 
    app.use((req, res, next) => {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        next();
    });
    
    // Handle connections
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    app.get('/', (req, res) => {
        res.send('<h1>Hello, Node.js streaming server!</h1>');
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on process ${process.pid} at http://localhost:${PORT}`);
    });
}