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

// Continuously match partners
setInterval(() => {
    console.log('looking for matches');
    if (!!qRight.length && !!qLeft.length) {
        console.log('Found match!');
        let convId = short.generate();
        let right = qRight.pop();
        let left = qLeft.pop();
        // TODO: Individual event emits
        foundMatchEmitter.emit('found', {convId, right, left});
    }
}, 1000);

const lookForPartner = (socket, id, wing, name) => {
    console.log('new user looking for partner');
    let q = wing === 'right' ? qRight : qLeft;
    q.push({id, name});
    console.log("Right:", qRight);
    console.log("Left:", qLeft);
    foundMatchEmitter.on('found', (match) => {
        if (match[wing].id === id ) {
            socket.emit('partner', match);
        }
    });
};

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('req_partner', function(data) {
        let reqId = data.userId;
        let reqWing = data.wing;
        let reqName = data.name;
        console.log('requesting partner...');
        lookForPartner(socket, reqId, reqWing, reqName);
    });
    socket.on('disconnect', function() {
        console.log('disconnected');
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