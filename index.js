import express from "express";
import http from "http"
import { Server } from "socket.io";
import { connectDB } from "./config.db.js";
import { ChatMessageModel } from "./message.schema.js";
import { ChatUserModel } from "./user.schema.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
        }
})

io.on('connection',async(socket)=>{
    console.log('user connected:',socket.id)
    let users;
    const previousMessages = await ChatMessageModel.find({})
    socket.on('joinUser',async(username)=>{
        socket.join('1234');
        console.log(`${username} joined the room`)
        socket.emit('welcome',`Welcome ${username},enjoy chatting.`)
        const newUser = new ChatUserModel({username,connected:true})
        await newUser.save()
        socket.userId = newUser._id
        users = await ChatUserModel.find({connected:true})
        io.to('1234').emit('roomAlert',users)
        if (previousMessages) {
            io.to('1234').emit('previousMessages', previousMessages);
          }
    })
    socket.on('newMessage', async ({ username, message }) => {
        console.log(message);
        const createdAt = new Date();
        const newMessage = new ChatMessageModel({ username, message, createdAt });
        await newMessage.save();
        const currentTime = new Date().toLocaleString()
        const imageUrl = await fetch(`https://robohash.org/${username}`);
        io.to('1234').emit('broadcastMessage', {
          username,
          message,
          currentTime,
          imageUrl: imageUrl.url,
        });
      });
      socket.on('userTyping', (username) => {
        socket.broadcast.to('1234').emit('resUserTyping', `${username} typing...`);
      });
      socket.on('userNotTyping', () => {
        socket.broadcast.to('1234').emit('resUserNotTyping');
      });
      socket.on('disconnect', async () => {
        console.log('Connection disconnected');
        const userId = socket.userId;
        if (userId) {
          await ChatUserModel.findByIdAndDelete(userId);
        }
        users = await ChatUserModel.find({ connected: true });
        io.to('1234').emit('roomAlert', users);
      });
})

server.listen(3000,()=>{
    console.log('Server listening at 3000');
    connectDB()
})