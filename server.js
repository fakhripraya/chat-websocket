const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io').listen(http, {
    "transports": ['websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling'],
    "polling duration": 10
});

io.on('connection', socket => {

    socket.on('send message', ({ message, type, senderId }) => {
        io.emit('set message', { message, type, senderId })
    })

})

http.listen(3001, function () {
    console.log('listening on port 3001')
})