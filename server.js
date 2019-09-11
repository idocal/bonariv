const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uuid = require('uuid');
const short = require('short-uuid');
const bodyParser = require('body-parser');
const writeToBq = require('./write-to-bq');

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

    const convId = short.generate();
    // const matchedUser = queueForSearch.splice(Math.floor(Math.random()*queueForSearch.length), 1)[0];
    const matchedUser = queueForSearch.shift();

    console.log('Found match!');
    writeToBq({
        action: 'match',
        user_id: userId,
        partner_id: matchedUser.userId,
        conv_id: convId,
    });

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
        activeConnections[matchedUser.userId].convId = convId;
        activeConnections[userId].convId = convId;
    }

    else {
        if (!!activeConnections[userId]) {
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
        writeToBq({
            action: 'requestPartner',
            user_id: userId,
            partner_id: null,
            entry: null,
            wing: wing,
            avatar: avatar,
            conv_id: null,
            user_name: name,
        });
        socket.userId = userId;
        socket.userWing = wing;
        socket.userAvatar = avatar;
        activeConnections[userId] = socket;
        console.log('active now:', Object.keys(activeConnections).length);
        console.log(`Requesting partner for userId: ${userId}, ${wing}, ${name}`);
        lookForPartner(userId, wing, name, avatar);
    });

    socket.on('nextPartner', function(data) {
        const { userId, partnerId } = data;
        console.log(`next from ${userId} to ${partnerId}`);
        if (activeConnections[partnerId] && activeConnections[partnerId].activePartnerId === userId) {
            setTimeout(() => {
                activeConnections[partnerId].emit('partnerDisconnect');
            }, 2000);
        }
        socket.emit('partnerDisconnect');
    });

    // New message
    socket.on('newMessage', function(data) {
        const { content, time, to } = data;
        writeToBq({
            action: 'newMessage',
            user_id: socket.userId,
            partner_id: to,
            entry: content,
            wing: socket.userWing,
            avatar: socket.userAvatar,
            conv_id: socket.convId,
        });
        console.log('newMessage', data);
        if (!activeConnections[to] || !activeConnections[to].emit) {
            console.log('Try to connect dead user');
            // Think about what we want to do here
            return;
        }
        activeConnections[to] && activeConnections[to].emit('newMessage', { content, time, from: socket.userId });
    });

    // Timeout
    socket.on('chatTimeout', function() {
        if (socket.userId && activeConnections[socket.userId]) {
            const { activePartnerId } = activeConnections[socket.userId];
            if (activePartnerId && activeConnections[activePartnerId]) {
                activeConnections[activePartnerId].emit('partnerDisconnect', {});
            }
            activeConnections[socket.userId].emit('partnerDisconnect', {});
        }
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
        console.log('active now:', Object.keys(activeConnections).length);
    });
});

app.use(bodyParser.json());

app.get('/ping', (req, res) => {
    // Cookie handler
    let user_uuid = uuid.v4();
    let ip = null;
    if (req.headers.cookie) {
        let dict = {};
        let rc = req.headers.cookie;
        rc && rc.split(';').forEach(function( cookie ) {
            let parts = cookie.split('=');
            dict[parts.shift().trim()] = decodeURI(parts.join('='));
        });
        if (!dict.uuid) {
            res.cookie('uuid', user_uuid, { maxAge: 900000, httpOnly: false});
        } else {
            user_uuid = dict.uuid;
        }
    }
    if (!req.headers.cookie) {
        res.cookie('uuid', user_uuid, { maxAge: 900000, httpOnly: false});
    }

    // Create userId and return
    let userId = short.generate();
    writeToBq({
        action: 'ping',
        user_id: userId,
        uuid: user_uuid,
        ip: !!req.headers ? req.headers['x-forwarded-for'] : null,
        user_agent: !!req.headers ? req.headers['user-agent'] : null
    });
    res.send({"success": true, "userId": userId});
});

app.use(express.static(path.join(__dirname, 'client', 'build')));

app.get('*', function(req, res) {
    res.redirect('/');
});

if (module === require.main) {
    const PORT = process.env.PORT || 8080;
    http.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
        console.log('Press Ctrl+C to quit.');
    });
}