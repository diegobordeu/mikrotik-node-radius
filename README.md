# mikrotik-node-radius


mikrotik-node-radius is a Radius server for mikrtik RouterOS hotspot's captive portal authentication. This solution allows some network clients to bypass hotspot catpive portal without disableling the captive portal for other clients in multiple networks at the same time. Mikrotik-node-radius uses client's mac-address so it is posible to check if that device should have direct access to any of your network without going through catptive portal.
- Unlike IP bindings, this solutions allow to have real time control of hotspot authentification for multiple networks and endless amount of clients.
- Authetification method can be configured as you want using your own securitie standarts.
- Useful if you want to develop a scalable payment subscription model for you network services.
- Allows access-request and accounting-request packect.
- Accounting-Interim-Update packets can be use for monitoring clients data flow.

mikrotik-node-radius use node-radius library, node-radius is a RADIUS packet encoding/decoding library for node.js written in Javascript. With node-radius you can easily decode received packets, encode packets to send, and prepare responses to received packets. node-radius supports both RADIUS authentication and RADIUS accounting packets.
For more node-radius documentation please go to:
# node-radius [![Build Status](https://secure.travis-ci.org/retailnext/node-radius.png)](http://travis-ci.org/retailnext/node-radius) - A RADIUS library for node.js




# Server Side Config:
```javascript
const secret = 'shared_secret';
function checkAuth(username, pass) {
  return new Promise((resolve) => {
    const bool = true; // do what ever you want to decide if that user should bypass hotspot's captive portal
    return bool ? resolve(true) : resolve(false);
  });
}
```
You can use your own database to check username and give or no authentication.
# Accounting decoded packet:
    { code: 'Accounting-Request',
      identifier: 218,
      length: 191,
      authenticator: '********',
      attributes:
       { 'Acct-Status-Type': 'Interim-Update',
         'NAS-Port-Type': 'Wireless-802.11',
         'Calling-Station-Id': 'AA:BB:CC:DD:00:11',
         'Called-Station-Id': 'hotspot1',
         'NAS-Port-Id': 'bridge1',
         'User-Name': 'AA:BB:CC:DD:00:11',
         'NAS-Port': 2161115209,
         'Acct-Session-Id': '80d00049',
         'Framed-IP-Address': '10.5.0.247',
         'Vendor-Specific': {},
         'Event-Timestamp': 2018-12-28T15:10:51.000Z,
         'Acct-Input-Octets': 1286,
         'Acct-Output-Octets': 502,
         'Acct-Input-Gigawords': 0,
         'Acct-Output-Gigawords': 0,
         'Acct-Input-Packets': 15,
         'Acct-Output-Packets': 3,
         'Acct-Session-Time': 159,
         'NAS-Identifier': '*******',
         'Acct-Delay-Time': 0,
         'NAS-IP-Address': '********' },
      raw_attributes:
       [******],
    }
Acct-XXX fields can be use for monitoring client device trafic.

# RouterOS Client Side Config:
Radius > Add:
- Service: hotspot.
- Address: $server_side_address
- authentication port: 1812 // you can choose any
- Accounting port: same as above
- Timeoute: 300ms can be not engouth, rise it to 2000ms if you need
- esle paraemters: leave as default
Ip > Hotspost > Server Profiles > (edit or create a new one)
- Login By: MAC: checked
- Login By: HTTP CHAP: checked
. RADIUS: Use RADIUS: checked
- RADIUS: Accounting: checked
- RADIUS: Mac Format: XX:XX:XX:XX:XX:XX
- RADIUS: Interim Update: as you want
- RADIUS: NAS Port type: 19 (Wireless-802.11)


# Server Basic Example:

```javascript
const radius = require('./lib/radius');
const dgram = require('dgram');

const secret = 'shared_secret';
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
```
# Code output with 2 devices:
```console
radius server listening 0.0.0.0:1812
Access-Request of user 9C:4F:DA:11:XX:XX
Accounting-Request Acct-Status-Type: Startuser: 9C:4F:DA:11:XX:XX
Access-Request of user 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Startuser: 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 9C:4F:DA:11:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 9C:4F:DA:11:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 9C:4F:DA:11:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Stopuser: 80:AD:16:E4:XX:XX
Accounting-Request Acct-Status-Type: Interim-Updateuser: 9C:4F:DA:11:XX:XX
Accounting-Request Acct-Status-Type: Stopuser: 9C:4F:DA:11:XX:XX
```
