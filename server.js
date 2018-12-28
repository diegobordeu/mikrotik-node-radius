const dgram = require('dgram');

const secret = 'radius_secret';
const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
  const packet = await readPacket(msg, secret);
  const username = packet.attributes['User-Name'];
  // console.log(packet, 'dsadsa');

  if (packet.code === 'Access-Request') {
    checkAuth(username, packet, rinfo);
    console.log(`${packet.code} of user ${username}`);
  }
  if (packet.code === 'Accounting-Request') {
    console.log(packet);
    console.log(`${packet.code} Acct-Status-Type: ${packet.attributes['Acct-Status-Type']}user: ${username}`);
    sendResponde(packet, rinfo);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`radius server listening ${
    address.address}:${address.port}`);
});

server.bind(1812);
