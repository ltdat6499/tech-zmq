const moment = require("moment");
const { frontendIp, createSocket } = require("./zmq");

const sock = createSocket("dealer", "API:", frontendIp, "connect");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const responses = {
	data: [],
	locked: false,
};
let doneIndexes = [];
const requestTimeout = 30000;

const getResponseByRequestId = (requestId, timeout = [30, "seconds"]) => {
	return new Promise((resolve, reject) => {
		const timeOut = moment()
			.add(...timeout)
			.valueOf();
		const responseWaiter = setInterval(() => {
			if (responses.locked) {
				return;
			}
			if (timeOut < moment().valueOf()) {
				clearInterval(responseWaiter);
				return reject("timeout");
			}

			const index = responses.data.findIndex(
				(item) => item.requestId === requestId && item.doneAt
			);
			if (index < 0) {
				return;
			}
			response = responses.data[index];
			doneIndexes.push(index);
			clearInterval(responseWaiter);
			return resolve(response);
		}, 10);
	});
};

const sendRequest = (data) => {
	responses.data.push(data);
	sock.send(JSON.stringify(data));
};

sock.on("message", (response) => {
	response = JSON.parse(response.toString());
	const index = responses.data.findIndex(
		(item) => item.requestId === response.requestId
	);
	if (index !== -1) {
		responses.data[index] = { ...response, doneAt: moment().valueOf() };
	}
});

setInterval(async () => {
	responses.locked = true;
	await sleep(500);
	responses.data = responses.data.filter(
		(item, index) =>
			!doneIndexes.includes(index) &&
			moment().valueOf() - item.requestAt <= requestTimeout &&
			moment().valueOf() - item.doneAt <= requestTimeout
	);
	doneIndexes = [];
	responses.locked = false;
	console.log("clear responses");
	console.log(responses.data);
	console.log(doneIndexes);
}, 30001);

module.exports = {
	getResponseByRequestId,
	sendRequest,
};
