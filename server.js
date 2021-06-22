const app = require('express')()
const { Op, where, QueryTypes } = require("sequelize");
const cors = require('cors');
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

// Database
const db = require('./config/database');

const { DBChatRoom, DBChatRoomMembers, DBChatRoomChats } = require('./models/room_chat');

app.use(cors());

// Test DB
db.authenticate()
    .then(() => console.log('Connection to the database is established'))
    .catch(err => console.log('Error: ' + err))

io.on('connection', socket => {

    // trigger rerender for the first time
    io.to(socket.id).emit('trigger rerender')

    socket.on('join room', (room, user, users, callback) => {

        // filter the room id
        const roomId = room !== null ? room.id : 0;
        // trigger rerender to the selected user for joining the room
        io.to(socket.id).emit('trigger' + user.id)

        if (roomId !== 0) {
            DBChatRoomChats.findAll({
                raw: true,
                where: {
                    room_id: {
                        [Op.eq]: roomId
                    }
                }
            }).then(function (res) {
                db.transaction().then(function (t) {
                    DBChatRoomChats.update({
                        chat_read: true
                    }, {
                        where: {
                            sender_id: {
                                [Op.ne]: user.id
                            },
                            room_id: {
                                [Op.eq]: roomId
                            }
                        }
                    }).then(function () {
                        t.commit();
                        callback({ error: null, callbackRoom: room, callbackChats: res });
                    }).catch(function (err2) {
                        t.rollback();
                        callback({ error: err2, callbackRoom: null, callbackChats: null });
                    });
                })
            }).catch(function (err) {
                callback({ error: err, callbackRoom: null, callbackChats: null });
            })
        } else {
            if (users !== null) {
                db.query(
                    'SELECT * FROM db_chat_room_members WHERE user_id = ? or user_id = ? GROUP BY room_id HAVING count(*) = 2',
                    {
                        replacements: [users[0].user_id, users[1].user_id],
                        type: QueryTypes.SELECT
                    }
                ).then(function (res) {
                    if (res === null || res.length === 0) {
                        db.transaction().then(function (t) {
                            DBChatRoom.create({
                                room_desc: "room-" + socket.id.toString(),
                                is_active: true,
                                created_by: user.username,
                                modified_by: user.username,
                            }).then(function (res2) {
                                const roomObj = res2.get({ plain: true })
                                users.forEach(u => {
                                    DBChatRoomMembers.create({
                                        room_id: roomObj.id,
                                        user_id: u.user_id,
                                        is_active: true,
                                        created_by: user.username,
                                        modified_by: user.username,
                                    }).catch(function (err3) {
                                        t.rollback();
                                        callback({ error: err3, callbackRoom: null, callbackChats: null });
                                    });
                                });
                                t.commit();
                                callback({ error: null, callbackRoom: roomObj, callbackChats: null });
                            }).catch(function (err2) {
                                t.rollback();
                                callback({ error: err2, callbackRoom: null, callbackChats: null });
                            });
                        });
                    } else {
                        DBChatRoomChats.findAll({
                            raw: true,
                            where: {
                                room_id: {
                                    [Op.eq]: res[0].room_id
                                }
                            }
                        }).then(function (res2) {
                            db.transaction().then(function (t) {
                                DBChatRoomChats.update({
                                    chat_read: true
                                }, {
                                    where: {
                                        sender_id: {
                                            [Op.ne]: user.id
                                        },
                                        room_id: {
                                            [Op.eq]: roomId
                                        }
                                    }
                                }).then(function (res3) {
                                    t.commit();
                                    callback({ error: null, callbackRoom: { id: res[0].room_id }, callbackChats: res2 });
                                }).catch(function (err3) {
                                    t.rollback();
                                    callback({ error: err3, callbackRoom: null, callbackChats: null });
                                });
                            })
                        }).catch(function (err2) {
                            callback({ error: err2, callbackRoom: null, callbackChats: null });
                        })
                    }
                }).catch(function (error) {
                    console.log(error)
                    callback(error);
                });
            }
        }

    });

    socket.on('send message', ({ sender, receiver, message, messages, room }, callback) => {
        db.transaction().then(function (t) {
            DBChatRoomChats.create({
                room_id: room.id,
                sender_id: sender.id,
                chat_body: message,
                attachment: null, // next feature
                pic_url: null, // next feature
                chat_read: false,
                is_active: true,
                created_by: sender.username,
                modified_by: sender.username,
            }).then(function (res) {
                io.emit("set message" + receiver.user_id, { message: res, messages: messages, serverSender: sender, serverReceiver: receiver, roomId: room.id })
                io.emit("set message" + sender.id, { message: res, messages: messages, serverSender: sender, serverReceiver: receiver, roomId: room.id })
                io.emit('trigger' + sender.id)
                io.emit('trigger' + receiver.user_id)
                t.commit();
                callback(null);
            }).catch(function (error) {
                t.rollback();
                callback(error);
            });
        });
    })

    socket.on('read messages', ({ reader, roomId }, callback) => {
        db.transaction().then(function (t) {
            DBChatRoomChats.update({
                chat_read: true
            }, {
                where: {
                    sender_id: {
                        [Op.ne]: reader.id
                    },
                    room_id: {
                        [Op.eq]: roomId
                    }
                }
            }).then(function (res) {
                t.commit();
                callback(null);
            }).catch(function (error) {
                t.rollback();
                callback(error);
            });
        });
    })

    socket.on('disconnect', function (reason) {
        if (reason === "ping timeout") {
        }
    });

})

http.listen(3001, function () {
    console.log('listening on port 3001')
})