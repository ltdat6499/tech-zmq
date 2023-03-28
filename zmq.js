const zmq = require("zeromq");
const backendIp = "tcp://127.0.0.1:12345";
const frontendIp = "tcp://127.0.0.1:12346";
const captureIp = "tcp://127.0.0.1:12347";

const createSocket = (sockType, idPrefix, address, mode) => {
	const sock = zmq.socket(sockType);
	sock.identity = idPrefix + process.pid;
	sock[mode](address);
	return sock;
};

zmq.proxy = function proxy(frontend, backend, capture) {
	switch (frontend.type + "/" + backend.type) {
		case "push/pull":
		case "pull/push":
		case "xpub/xsub":
			if (capture) {
				frontend.on("message", function () {
					backend.send([].slice.call(arguments));
				});

				backend.on("message", function () {
					frontend.send([].slice.call(arguments));

					//forwarding messages over capture socket
					capture.send([].slice.call(arguments));
				});
			} else {
				//no capture socket provided, just forwarding msgs to respective sockets
				frontend.on("message", function () {
					backend.send([].slice.call(arguments));
				});

				backend.on("message", function () {
					frontend.send([].slice.call(arguments));
				});
			}
			break;
		case "router/dealer":
		case "xrep/xreq":
			if (capture) {
				//forwarding router/dealer pack signature: id, delimiter, msg
				frontend.on("message", function (id, delimiter, msg) {
					backend.send([].slice.call(arguments));
				});

				backend.on("message", function (id, delimiter, msg) {
					frontend.send([].slice.call(arguments));

					//forwarding message to the capture socket
					capture.send([].slice.call(arguments));
				});
			} else {
				//forwarding router/dealer signatures without capture
				frontend.on("message", function (id, delimiter, msg) {
					backend.send([].slice.call(arguments));
				});

				backend.on("message", function (id, delimiter, msg) {
					frontend.send([].slice.call(arguments));
				});
			}
			break;
		default:
			throw new Error("wrong socket order to proxy");
	}
};

module.exports = {
	backendIp,
	frontendIp,
	captureIp,
	createSocket,
	zmq,
};
