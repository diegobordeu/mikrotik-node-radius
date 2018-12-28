const radius = require('../lib/radius');
const dgram = require('dgram');

const secret = 'radius_secret';
const server = dgram.createSocket('udp4');

function readPacket(msg, secret) {
  return new Promise((resolve, reject) => {
    try {
      return resolve(radius.decode({
        packet: msg,
        secret,
      }));
    } catch (e) {
      reject(`Failed to decode radius packet, silently dropping:${e}`);
    }
  });
}

function checkAuth(username, packet, rinfo) {
  // if (db.includes(username)) {
  if (true) {
    sendAuth(true, username, packet, rinfo);
  } else {
    sendAuth(false, username, packet, rinfo);
  }
}

function sendAuth(auth, username, packet, rinfo) {
  // console.log(buildResponse(auth, packet), 'responseeeeeeeeeeeeee');
  const response = radius.encode_response(buildResponse(auth, packet));
  // console.log(response.code);

  // console.log(`Sending ${response.code} for user ${username}`);
  server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.log('Error sending response to ', rinfo);
    }
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

function sendResponde(packet, rinfo) {
  const response = radius.encode_response({
    packet,
    code: 'Accounting-Response',
    secret
  });
  server.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
    if (err) {
      console.log('Error sending response to ', rinfo);
    }
  });
}
