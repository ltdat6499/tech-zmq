const { backendIp, frontendIp, captureIp, createSocket, zmq } = require("./zmq");

const backend = createSocket("dealer", "backend:", backendIp, "bindSync");
const frontend = createSocket("router", "frontend:", frontendIp, "bindSync");
const capture = createSocket("dealer", "captured:", captureIp, "bindSync");

zmq.proxy(frontend, backend, capture);

const sock = createSocket("dealer", "CAPTURE:", captureIp, "connect");
sock.on("message", (clientId, data) => {
	console.log(clientId.toString(), data.toString());
});
