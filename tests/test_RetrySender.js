const chai = require("chai");
const expect = chai.expect;
const RetrySender = require("../src/RetrySender");
const FailingSender = require("./fixtures/FailingSender");
const Request = require("../src/Request.js");
const FakeSleeper = require("../src/util/FakeSleeper");

async function sendWithRetry(retries, inner, sleeper) {
	const request = new Request();
	const sender = new RetrySender(retries, inner, sleeper);
	return await sender.send(request);
}

describe ("Retry Sender tests", function () {
	it("test success does not retry", async function () {
		let inner = new FailingSender(["200"]);
		await sendWithRetry(5, inner, new FakeSleeper());

		expect(inner.currentStatusCodeIndex).to.equal(1);
	});

	it("test client error does not retry", async function () {
		let inner = new FailingSender(["422"]);
		await sendWithRetry(5, inner, new FakeSleeper());

		expect(inner.currentStatusCodeIndex).to.equal(1);
	});

	it("test will retry until success", async function () {
		let inner =  new FailingSender(["500", "500", "500", "200", "500"]);
		await sendWithRetry(10, inner, new FakeSleeper());

		expect(inner.currentStatusCodeIndex).to.equal(4);
	});

	it("test return response if retry limit exceeded", async function () {
		let inner = new FailingSender(["500", "500", "500", "500", "500"]);
		const sleeper = new FakeSleeper();
		const response = await sendWithRetry(4, inner, sleeper);

		expect(response);
		expect(inner.currentStatusCodeIndex).to.equal(5);
		expect(response.statusCode).to.equal("500");
		expect(sleeper.sleepDurations).to.deep.equal([0, 1, 2, 3]);
	});

	it("test backoff does not exceed max", async function () {
		let inner = new FailingSender(["500", "500", "500", "500", "500", "500", "500", "500", "500", "500", "500", "500", "500", "200"]);
		const sleeper = new FakeSleeper();

		await sendWithRetry(20, inner, sleeper);

		expect(sleeper.sleepDurations).to.deep.equal([0,1,2,3,4,5,6,7,8,9,10,10,10]);
	});

	it("test empty status does not retry", async function () {
		let inner = new FailingSender([]);
		await sendWithRetry(5, inner, new FakeSleeper());

		expect(inner.currentStatusCodeIndex).to.equal(1);
	});

	it("test sleep on rate limit", async function () {
		let inner = new FailingSender(["429", "200"]);
		const sleeper = new FakeSleeper();

		await sendWithRetry(5, inner, sleeper);

		expect(sleeper.sleepDurations).to.deep.equal([10]);
	});

	it("test rate limit error return", async function () {
		let inner = new FailingSender(["429"], {"Retry-After": 7});
		const sleeper = new FakeSleeper();

		await sendWithRetry(10, inner, sleeper);

		expect(sleeper.sleepDurations).to.deep.equal([7]);
	});

	it("test retry after invalid value", async function () {
		let inner = new FailingSender(["429"], {"Retry-After": "a"});
		const sleeper = new FakeSleeper();

		await sendWithRetry(10, inner, sleeper);

		expect(sleeper.sleepDurations).to.deep.equal([10]);
	});

	it("test retry error", async function () {
		let inner = new FailingSender(["429"], undefined, "Big Bad");
		const sleeper = new FakeSleeper();

		const response = await sendWithRetry(10, inner, sleeper);

		expect(response.error).to.equal("Big Bad");
	});
});