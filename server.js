const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 5000;
const uuid = require('uuid');
const short = require('short-uuid');
const bodyParser = require('body-parser');
const EventEmitter = require('events');

class FoundMatchEmitter extends EventEmitter {}
const foundMatchEmitter = new FoundMatchEmitter();

// parse application/json
app.use(bodyParser.json());

let qRight = [];
let qLeft = [];

let activeConnections = {};

// Continuously match partners
setInterval(() => {
    if (!!qRight.length && !!qLeft.length) {
        console.log('Found match!');
        let convId = short.generate();
        let right = qRight.pop();
        let left = qLeft.pop();
        // TODO: Individual event emits
        foundMatchEmitter.emit('found', {convId, right, left});
    }
}, 1000);

// When found a match, emit to user
foundMatchEmitter.on('found', (match) => {
    console.log('match:', match);
    activeConnections[match.right.id].emit('partner', match);
    activeConnections[match.left.id].emit('partner', match);
});

// Add a new user to the queue
const lookForPartner = (socket, id, wing, name) => {
    console.log('new user looking for partner');
    let q = wing === 'right' ? qRight : qLeft;
    q.push({id, name});
    console.log("Right:", qRight);
    console.log("Left:", qLeft);
};

// Manage socket connections
io.on('connection', function(socket){
    console.log('a user connected');

    // Look for a partner
    socket.on('req_partner', function(data) {
        const { userId, wing, name } = data;
        socket.userId = userId;
        activeConnections[userId] = socket;
        console.log('Active connections now after req_partner:', Object.keys(activeConnections).length);
        console.log(`Requesting partner for userId: ${userId, wing, name}`);
        lookForPartner(socket, userId, wing, name);
    });

    socket.on('newMessage', function(data) {
        const { content, time, to } = data;
        if (!activeConnections[to] || !activeConnections[to].emit) {
            console.log('Try to connect dead user');
            // Think about what we want to do here
            return;
        }
        activeConnections[to].emit('newMessage', { content, time, from: socket.userId });
    });
    

    // Disconnect
    socket.on('disconnect', function() {
        if (socket.userId && activeConnections[socket.userId]) {
            delete activeConnections[socket.userId];
        }
        console.log('disconnected userId:', socket.userId);
    });
});

http.listen(port, function(){
    console.log(`listening on port ${port}`);
});

// Manage user first entry
app.get('/ping', (req, res) => {
    // Cookie handler
    if (req.headers.cookie) {
        let dict = {};
        let rc = req.headers.cookie;
        rc && rc.split(';').forEach(function( cookie ) {
            let parts = cookie.split('=');
            dict[parts.shift().trim()] = decodeURI(parts.join('='));
        });
        if (!dict.uuid) {
            res.cookie('uuid', uuid.v4(), { maxAge: 900000, httpOnly: false});
        }
    }
    if (!req.headers.cookie) {
        res.cookie('uuid', uuid.v4(), { maxAge: 900000, httpOnly: false});
    }

    // Create userId and return
    res.send({"success": true, "userId": short.generate()});
});