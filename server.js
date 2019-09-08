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

// When found a match, emit to user
foundMatchEmitter.on('found', (match) => {
    console.log('match:', match);
    console.log('activeconnn', match, Object.keys(activeConnections).length)
    activeConnections[match.right.userId].emit('partner', { convId: match.convId, partnerId: match.left.userId, partnerName: match.left.name });
    activeConnections[match.left.userId].emit('partner', { convId: match.convId, partnerId: match.right.userId, partnerName: match.right.name });
});

// Add a new user to the queue
const lookForPartner = (socket, userId, wing, name) => {
    console.log('new user looking for partner');
    const isLeft = wing !== 'right'
    const queueForSearch = isLeft ? qRight : qLeft;
    const queueForStandBy = !isLeft ? qRight : qLeft;


    if (!queueForSearch.length) {
        console.log(`Dont have any partner for userId: ${userId}, write to queue: ${wing}`)
        queueForStandBy.push({userId, name});
        return;
    }
    console.log('Found match!');
    const convId = short.generate();
    const matchedUser = queueForSearch.pop();
    const right = isLeft ? matchedUser : {userId, name};
    const left = isLeft ? {userId, name} : matchedUser;
    // TODO: Individual event emits
    foundMatchEmitter.emit('found', {convId, right, left});
};

// Manage socket connections
io.on('connection', function(socket){
    console.log('a user connected');

    // Look for a partner
    socket.on('req_partner', function(data) {
        console.log('data', data)
        const { userId, wing, name } = data;
        socket.userId = userId;
        activeConnections[userId] = socket;
        console.log('Active connections now after req_partner:', Object.keys(activeConnections).length);
        console.log(`Requesting partner for userId: ${userId}, ${wing}, ${name}`);
        lookForPartner(socket, userId, wing, name);
    });

    socket.on('newMessage', function(data) {
        const { content, time, to } = data;
        console.log('newMessage', data)
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