var express = require('express');
var oracledb = require('./node_modules/oracledb');
oracledb.autoCommit = true;
var sprintf = require('sprintf-js').sprintf;




DBconnction = function (callback) {

    oracledb.getConnection({
        user: "mtc",
        password: "mtc",
        connectString: "192.168.7.30:1521/MONGBILL",
    },
        function (err, connection) {
            if (err) {
                // sendresult.result.code = -1;
                // sendresult.result.desc = "Oracle connection err";
                console.error(err); 
                return;
            }
            callback(connection);

        })

}

doquery = function(callback){

}


module.exports = {
    DBconnction: DBconnction,
    doquery:doquery
};