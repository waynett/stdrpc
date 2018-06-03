const assert = require("assert");
const Koa = require("koa");
const json = require("koa-json");
const bodyParser = require("koa-bodyparser");
const stdrpc = require("../");

describe("stdrpc", () => {
	before(function() {
		const app = new Koa();

		app.use(bodyParser());
		app.use(json());

		app.use(async ctx => {
			const { id, method, params } = ctx.request.body;

			try {
				const result = ({
					sum: (a, b) => a + b
				})[method](...params);

				ctx.body = {
					id,
					result
				};
			} catch({ message }) {
				ctx.body = {
					id,
					error: message
				};
			}
		});

		this.server = app.listen(8000);
	});

	const rpc = stdrpc({
		url: "http://localhost:8000"
	});

	it("should throw on bad config", () => {
		assert.throws(() => stdrpc(100));
	});

	it("should have every possible method", () => {
		assert.equal("sum" in rpc, true);
	});

	it("should support overwrites", () => {
		const func = (a, b) => a * b;

		rpc.multiply = func;

		assert(rpc.multiply === func);
	});

	it("should send and receive correct request and response", async () => {
		assert.equal(await rpc.sum(100, 200), 300);
	});

	it("should fail on bad method", async () => {
		await assert.rejects(async () => rpc.divide());
	});

	after(function() {
		this.server.close();
	});
});
