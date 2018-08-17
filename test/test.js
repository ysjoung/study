//var test = require('tape');
//var supertest = require('supertest');
//var app = require('../server');
var assert = require('assert');
var http = require('http');


describe('SERVER test', function () {

	describe('/subs', function () {
		it('search All Data', function (done) {
			http.get('http://localhost:3000/subs', function (response) {
				// Assert the status code.
				assert.equal(response.statusCode, 200);


				var body = '';
				response.on('data', function (d) {
					body += d;
				});
				response.on('end', function () {
					var jsonpa = JSON.parse(body);
					// Let's wait until we read the response, and then assert the body
					assert.equal(jsonpa.result.code, 0);
					assert.equal(jsonpa.result.desc, "success")
					done();
				});
			});
		});



		it('search using ID data', function (done) {
			http.get('http://localhost:3000/subs?id=1', function (response) {
				assert.equal(response.statusCode, 200);


				var body = '';
				response.on('data', function (d) {
					body += d;
				});
				response.on('end', function () {
					var jsonpa = JSON.parse(body);
					assert.equal(jsonpa.result.code, 0);
					assert.equal(jsonpa.result.desc, "success");
					done();
				});
			});
		});


		it('search using page and item', function (done) {
			http.get('http://localhost:3000/subs?page=1&item=20', function (response) {
				assert.equal(response.statusCode, 200);


				var body = '';
				response.on('data', function (d) {
					body += d;
				});
				response.on('end', function () {
					var jsonpa = JSON.parse(body);
					assert.equal(jsonpa.result.code, 0);
					assert.equal(jsonpa.result.desc, "success")
					done();
				});
			});
		});

	});
});

