const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const httpServer = require('http').createServer();
const ws = require('ws');
const wsStream = require('websocket-stream');

const MQTT_PORT = 1883;
const WS_PORT = 8884;

// 1. Start Standard MQTT Server (TCP)
server.listen(MQTT_PORT, function () {
  console.log(`MQTT Broker (TCP) running on port ${MQTT_PORT}`);
});

// 2. Start WebSocket Server (for browser clients)
// Create a WebSocket server attached to the HTTP server
const wss = new ws.Server({ server: httpServer });

wss.on('connection', function (conn, req) {
  const stream = wsStream(conn, { binary: true });
  aedes.handle(stream, req);
});

httpServer.listen(WS_PORT, function () {
  console.log(`MQTT Broker (WebSocket) running on port ${WS_PORT}`);
});

// Authentication (Optional: Allow everyone for now)
aedes.authenticate = function (client, username, password, callback) {
  // Allow everyone
  callback(null, true);
  
  // Or verify credentials:
  // if (username === 'user' && password.toString() === 'pass') {
  //   callback(null, true);
  // } else {
  //   const error = new Error('Auth error');
  //   error.returnCode = 4;
  //   callback(error, null);
  // }
};

// Events
aedes.on('client', function (client) {
  console.log('Client Connected:', client ? client.id : client);
});

aedes.on('clientDisconnect', function (client) {
  console.log('Client Disconnected:', client ? client.id : client);
});

aedes.on('publish', function (packet, client) {
  if (packet && packet.payload) {
    if (packet.topic.startsWith('$SYS/')) return; // Ignore system messages
    console.log('Published', packet.topic, packet.payload.toString());
  }
});
