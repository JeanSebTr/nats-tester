var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    nats = require('nats');

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function(req, res)
{
  res.redirect('/index.html');
});

io.sockets.on('connection', function (socket) {
  socket.emit('msg', { event: 'socket.connect', msg: 'connected' });
  var receive = function(msg, reply, subject) {
    socket.emit('msg', { event: subject, msg: msg });
  };
  socket.on('doconnect', function (data) {
    socket.nats = nats.connect({url: data.url});
    socket.emit('msg', { event: 'nats.connect', msg: 'connected' });
  });
  socket.on('subscribe', function(data) {
    socket.nats.subscribe(data.event, receive);
    socket.emit('msg', { event: 'nats.subscribe', msg: data.event });
  });
  socket.on('publish', function(data) {
    socket.nats.publish(data.event, JSON.stringify(data.msg));
    socket.emit('msg', { event: 'nats.publish', msg: data.event });
  });
});

app.listen(process.env.VMC_APP_PORT || 3001);