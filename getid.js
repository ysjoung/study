var express = require('express');
var oracledb = require('./node_modules/oracledb');
oracledb.autoCommit = true;
var opt = require('getopt');
var sprintf = require('sprintf-js').sprintf;
var events = require('events');
var async = require('async');
var promise = require('promise');
var request = require("request");
var timer = require('timers');

var app = express();

var options = {
	"gconnection": null
}

var serverPromise = function () {
	return new Promise(function (resolve, reject) {

		var server = app.listen(3000, function () {
			console.log("express start");

		})

		app.get('/subs/:id', function (req, res) {

			var searchlist = [];

			var query = "select ID, ACC_NBR, CUST_ID, UPDATE_DATE from subs where 1=1 ";

			if (req.params.id)
				query += "AND ID = " + req.params.id;

			options.gconnection.execute(query, function (err, result) {

				if (err) {
					reject(err);
					console.error(err.message);
					return;
				}

				if (typeof result.rows === "undefined") {
					console.log("END");
					return;
				}

				for (var i = 0; i < result.rows.length; i++) {

					var r = result.rows[i];
					var d = String(r[3]).substr(0, 25);

					var s = sprintf("%10s %10s %5s %10s ", r[0], r[1], r[2], d);

					searchlist.push(s);
					//console.log(s);
				}

				res.send(searchlist);
				resolve(searchlist);
			})
		});
	})
}

var connectPromise = new Promise(function (resolve, reject) {
	
	oracledb.getConnection({
		user: "mtc",
		password: "mtc",
		connectString: "192.168.7.30:1521/MONGBILL",
	},
		function (err, connection) {
			if (err) {
				reject(err);
				console.error(err); return;
			}
			options.gconnection = connection;

		})
}).then(serverPromise());













