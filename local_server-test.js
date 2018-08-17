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

var DB = require('./DB');

var app = express();

var options = {
	"gconnection": null
}

var sendresult = {
	"result": {
		"code": 0,
		"desc": "",
	},

	"objects": [],

	"pagenation": {
		"page": 0,
		"item": 0,
		"total": 0
	}

}


var doserver = DB.DBconnction(function (connection) {

	var server = app.listen(3000, function () {
		console.log("express start");

	})

	app.get('/subs', function (req, res) {
		

		//String -> number
		var page = req.query.page * 1;
		var item = req.query.item * 1;

		if (req.query.page && req.query.item) {
			var startnum = ((page - 1) * item) + 1;
			var endnum = page * item;
		}

		var searchlist = [];

		var query = "select ID, ACC_NBR, CUST_ID, UPDATE_DATE ,rownum as rnum from subs where 1=1 ";

		//var query = "select ID, ACC_NBR, CUST_ID, UPDATE_DATE ,rownum as rnum from subs where ID = 3208194 ";

		if (req.query.id) {
			query += "AND ID = " + req.query.id;
			console.log("query", query);
		}



		var lastquery = "select * from (" + query + ") A ";

		if (req.query.page && req.query.item) {
			lastquery += " where A.rnum between " + startnum + " AND " + endnum;
		}

		// options.gconnection.execute(lastquery, function (err, result) {
			connection.execute(lastquery, function (err, result) {

			if (result.rows == "") {
				sendresult.result.desc = "no Data";
				console.log("END");
			}
			else {
				sendresult.result.desc = "success";
			}

			if (err) {
				console.error(err.message);
				sendresult.result.code = -2;
				sendresult.result.desc = "execute query err";
				return;
			}

			for (var i = 0; i < result.rows.length; i++) {

				var r = result.rows[i];
				r[3] = String(r[3]).substr(0, 24);
				// var d = String(r[3]).substr(0, 25);

				// var s = sprintf("%10s %10s %5s %10s ", r[0], r[1], r[2], d);

				searchlist.push(r);
				//console.log(s);
			}

			//출력 객체 넣는 용도 수정필요
			sendresult.result.code = 0;

			sendresult.objects = searchlist;
			sendresult.pagenation.page = page;
			sendresult.pagenation.item = item;
			sendresult.pagenation.total = (page-1) * item + i; // 수정필요

			res.json(sendresult);
		})
	});
});



/*
var connectPromise = new Promise(function (resolve, reject) {

	oracledb.getConnection({
		user: "mtc",
		password: "mtc",
		connectString: "192.168.7.30:1521/MONGBILL",
	},
		function (err, connection) {
			if (err) {
				sendresult.result.code = -1;
				sendresult.result.desc = "Oracle connection err";
				reject(err);
				console.error(err); return;
			}
			options.gconnection = connection;

		})
}).then(doserver());

*/











