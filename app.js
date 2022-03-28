const { Client, MessageMedia, NoAuth } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const config = require('./config')

const client = new Client({
    authStrategy: new NoAuth(),
    puppeteer: { headless: true }
});

client.initialize();

const app= express();
server=http.createServer(app)
const io=socketIO(server)
app.use(express.json());
app.use(express.urlencoded({extended: true}));


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
      client.on('authenticated', () => {
        socket.emit('authenticated', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        //console.log('AUTHENTICATED');
      });
    
      client.on('auth_failure', function(session) {
        socket.emit('message', 'Auth failure, restarting...');
      });
      client.on('disconnected', (reason) => {
        socket.emit('message', 'Whatsapp is logout');
       // console.log('Client was logged out', reason);
    });
})

// Send message
app.post('/send-message',  async (req, res) => {
      const number=req.body.number
      console.log(number);
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
//send message to multiple contacts
app.get('/mContact',async (req,res)=>{
  let contactlist = fs.readFileSync(config.contact)
  contactlist = contactlist.toString().split(/\r?\n/)
  for (const contact of contactlist) {
        const precontent = fs.readFileSync(config.content)
        let cont = encodeURI(precontent)
        let content=decodeURI(cont)
        client.sendMessage(contact,content).then(response => {
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
 
   }
});



server.listen(8000,()=>{
    console.log('server is running at 8000');
})