const { backendIp, createSocket } = require("./zmq");
const sock = createSocket("dealer", "WORKER:", backendIp, "connect");
sock.on("message", (clientId, data) => {
	console.log(sock.identity, data.toString());
	data = JSON.parse(data.toString());
	data.workerId = sock.identity;
	sock.send([clientId, JSON.stringify(data)]);
});
