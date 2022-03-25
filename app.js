const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { response } = require('express');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.initialize();

const app= express();
server=http.createServer(app)
const io=socketIO(server)
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


app.get('/',(req,res)=>{
    res.sendFile('index.html', {root: __dirname});
})
// Socket IO
io.on('connection', function(socket) {
    socket.emit('message', 'Connecting...');
    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
          socket.emit('qr', url);
          socket.emit('message', 'QR Code received, scan please!');
        });
      });
      client.on('ready',()=>{
        socket.emit('message', 'whatsapp is ready');

      })
})

// Send message
app.post('/send-message',  async (req, res) => {
      const number=req.body.number
      const message= req.body.message  
    client.sendMessage(number, message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });
  



server.listen(8000,()=>{
    console.log('server is running at 8000');
})