const radius = require('./lib/radius');
const dgram = require('dgram');

const secret = 'secret'
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  debug(msg, rinfo).then(() => {
    // console.log('succes');
  }).catch((err) => {
    console.log(err);
  });
});

const debug = async (msg, rinfo) => {
  const packet = await readPacket(msg, secret);
  const username = packet.attributes['User-Name'];
  // console.log(packet, 'dsadsa');

  if (packet.code === 'Access-Request') {
    const auth = await checkAuth();
    await sendAuth(auth, packet, rinfo);
    console.log(`${packet.code} of user ${username}`);
  }
  if (packet.code === 'Accounting-Request') {
    await sendAccountingResponde(packet, rinfo);
    console.log(`${packet.code} Acct-Status-Type: ${packet.attributes['Acct-Status-Type']}user: ${username}`);
  }
};

server.on('listening', () => {
  const address = server.address();
  console.log(`radius server listening ${address.address}:${address.port}`);
});

server.bind(1812);

function readPacket(msg, secret) {
  return new Promise((resolve, reject) => {
    const packet = radius.decode({
      packet: msg,
      secret,
    });
    return packet ? resolve(packet) : reject('auth error');
  });
}

function checkAuth() {
  return new Promise((resolve) => {
    const bool = true; // do what ever you want to decide if that user should bypass hotspot's captive portal
    return bool ? resolve(true) : resolve(false);
  });
}

function sendAuth(auth, packet, rinfo) {
  return new Promise((resolve, reject) => {
    const response = radius.encode_response(buildResponse(auth, packet));
    server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
      return err ? reject(`Error sending response to ${rinfo}`) : resolve();
    });
  });
}

function buildResponse(auth, packet) {
  return auth ? {
    packet,
    code: 'Access-Accept',
    secret,
  } : {
    packet,
    code: 'Access-Reject',
    secret,
  };
}

function sendAccountingResponde(packet, rinfo) {
  return new Promise((resolve, reject) => {
    const response = radius.encode_response({
      packet,
      code: 'Accounting-Response',
      secret,
    });
    server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
      return err ? reject(`Error sending response to ${rinfo}`) : resolve();
    });
  });
}
