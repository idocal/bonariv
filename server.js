const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 5000;
const uuid = require('uuid');
const short = require('short-uuid');
const bodyParser = require('body-parser');

const qRight = [];
const qLeft = [];

const activeConnections = {};

const lookForPartner = (userId, wing, name, avatar) => {
    console.log('new user looking for partner');
    const isLeft = wing !== 'right';
    const queueForSearch = isLeft ? qRight : qLeft;
    const queueForStandBy = !isLeft ? qRight : qLeft;


    if (!queueForSearch.length) {
        console.log(`Dont have any partner for userId: ${userId}, write to queue: ${wing}`);
        queueForStandBy.push({userId, name, avatar});
        return;
    }
    console.log('Found match!');
    const convId = short.generate();
    const matchedUser = queueForSearch.splice(Math.floor(Math.random()*queueForSearch.length), 1)[0];

    if (activeConnections[matchedUser.userId] && activeConnections[userId]) {
        activeConnections[matchedUser.userId].emit('partner', {
            convId,
            partnerId: userId,
            partnerName: name,
            partnerAvatar: avatar
        });

        activeConnections[userId].emit('partner', {
            convId,
            partnerId: matchedUser.userId,
            partnerName: matchedUser.name,
            partnerAvatar: matchedUser.avatar
        });

        activeConnections[matchedUser.userId].activePartnerId = userId;
        activeConnections[userId].activePartnerId = matchedUser.userId;
    }

    else {
        if (activeConnections[userId]) {
            lookForPartner(userId, wing, name, avatar)
        }

    }
};

// Manage socket connections
io.on('connection', function(socket){
    console.log('a user connected');

    // Look for a partner
    socket.on('req_partner', function(data) {
        console.log('requesting partner with data:', data);
        const { userId, wing, name, avatar } = data;
        socket.userId = userId;
        activeConnections[userId] = socket;
        console.log('Active connections now after req_partner:', Object.keys(activeConnections).length);
        console.log(`Requesting partner for userId: ${userId}, ${wing}, ${name}`);
        lookForPartner(userId, wing, name, avatar);
    });

    socket.on('newMessage', function(data) {
        const { content, time, to } = data;
        console.log('newMessage', data);
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
            const { activePartnerId } = activeConnections[socket.userId];
            if (activePartnerId && activeConnections[activePartnerId]) {
                activeConnections[activePartnerId].emit('partnerDisconnect', {});
            }
            delete activeConnections[socket.userId];
        }
        console.log('disconnected userId:', socket.userId);
    });
});

app.use(bodyParser.json());

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

app.use(express.static(path.join(__dirname, 'client', 'build')));

if (module === require.main) {
    const PORT = process.env.PORT || 8080;
    http.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
        console.log('Press Ctrl+C to quit.');
    });
}