const express = require("express");
const uuid = require("uuid");
const moment = require("moment");
const { getResponseByRequestId, sendRequest } = require("./api-helpers");

const app = express();
const port = 3001;

app.get("/", async (req, res) => {
	const request = {
		requestId: uuid.v4(),
		requestAt: moment().valueOf(),
		body: req.body,
	};
	sendRequest(request);
	try {
		const response = await getResponseByRequestId(request.requestId);
		return res.send(response);
	} catch (error) {
		console.log(error);
		return res.status(500);
	}
});

app.listen(port, () => {
	console.log(`app listening on port ${port}`);
});
