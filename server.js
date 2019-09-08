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

let activeConnections = [];

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
    let connections = activeConnections.map(c => c.userId);
    const rightIndex = connections.indexOf(match.right.id);
    const leftIndex = connections.indexOf(match.left.id);
    console.log('match connections:', connections);
    console.log('match:', match);
    console.log('right:', rightIndex);
    console.log('left:', leftIndex);
    activeConnections[rightIndex].socket.emit('partner', match);
    activeConnections[leftIndex].socket.emit('partner', match);
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
        let reqId = data.userId;
        let reqWing = data.wing;
        let reqName = data.name;
        activeConnections.push({ userId: reqId, socket: socket, socketId: socket.id });
        console.log('connections now:', activeConnections.map(c => c.socketId));
        console.log('requesting partner...');
        lookForPartner(socket, reqId, reqWing, reqName);
    });

    // Disconnect
    socket.on('disconnect', function() {
        let index = activeConnections.map(c => c.socketId).indexOf(socket.id);
        if (index > -1) {
            activeConnections.splice(index, 1)
        }
        console.log('disconnected');
        console.log('connections now:', activeConnections.map(c => c.socketId));
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