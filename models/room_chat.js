const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/database');

const DBChatRoom = db.define('db_chat_rooms', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    room_desc: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    created_by: {
        type: DataTypes.STRING
    },
    modified: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    modified_by: {
        type: DataTypes.STRING
    }
}, {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,
    // your other configuration here
});

const DBChatRoomMembers = db.define('db_chat_room_members', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    room_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    created_by: {
        type: DataTypes.STRING
    },
    modified: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    modified_by: {
        type: DataTypes.STRING
    }
}, {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,
    // your other configuration here
});

const DBChatRoomChats = db.define('db_chat_room_chats', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    room_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    sender_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    chat_body: {
        type: DataTypes.STRING,
        allowNull: true
    },
    attachment: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pic_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    chat_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    created_by: {
        type: DataTypes.STRING
    },
    modified: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    modified_by: {
        type: DataTypes.STRING
    }
}, {
    // don't add the timestamp attributes (updatedAt, createdAt)
    timestamps: false,
    // your other configuration here
});

DBChatRoom.sync().then(() => {
    console.log('DBChatRoom table created');
});

DBChatRoomMembers.sync().then(() => {
    console.log('DBChatRoomMembers table created');
});

DBChatRoomChats.sync().then(() => {
    console.log('DBChatRoomChats table created');
});
module.exports = { DBChatRoom, DBChatRoomMembers, DBChatRoomChats };