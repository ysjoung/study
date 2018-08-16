//선언 또는 매칭
var oracledb = require('./node_modules/oracledb');
oracledb.autoCommit = true;
var opt = require('getopt');
var sprintf = require('sprintf-js').sprintf;
var events = require('events');
var async = require('async');
var promise = require('promise');
var request = require("request");
var timer = require('timers');

var eventEmitter = new events.EventEmitter();

var options = {
  "total": 0,
  "allselectBool": false,
  "updateTEST1CHARGEBool": false,
  "test1in": "",
  "updatequery": "",
  "gconnection": null,
  "ratingAmt": [],
  "countr0": []
}


var query = "SELECT EVENT_INST_ID, CALLING_NBR , CALLED_NBR , START_TIME , DURATION, CHARGE1, CHARGE2, TEST1, TEST1CHARGE, rownum as rnum "
  + "FROM event_cdr_567 "
  + " WHERE 1=1 "

var myrequest = {
  method: 'POST',
  url: 'http://192.168.7.103:8011/api/v1/voice/rating',
  headers:
    { 'Content-Type': 'application/json' },
  body:
  {
    key: '11314925',
    main_product: 'ub_ngn_p_3500',
    status: 11,
    balance: 0,
    dbSession: false,
    counters: [],
    serviceId: 'MOBILE_VOICE',
    callType: '',
    calling: '11314925',
    startTime: '2018-07-02T20:42:08+0900',
    called: '364145',
    endTime: '2018-07-02T21:03:17+0900',
    duration: 1269,
    origCellId: '101'
  },
  json: true
};

//추가 - termCellID :  받는 사람 ID => 있을수도있고 없을수도 있다

eventEmitter.on('update', updateHandler);
eventEmitter.on(`allselect`, allselectHandler);



// getopt 사용
try {
  opt.setopt("c:d:n:w:a::");
} catch (e) {
  console.dir(e);
  return;
}
opt.getopt(function (o, p) {
  switch (o) {
    case "c":
      query += ` AND CALLING_NBR = '${p}'`;
      break;
    case "d":
      query += ` AND CALLED_NBR = '${p}'`;
      break;
    case "n":
      query += ` AND ROWNUM <= ${p}`;
      //options.where += ` AND ROWNUM <= ${p}`;
      break;
    case "w":
      options.test1in = p;
      options.updateTEST1CHARGEBool = false;
      break;
    case "a":
      options.allselectBool = true;
      options.updateTEST1CHARGEBool = true;

  }
});



oracledb.getConnection({
  user: "mtc",
  password: "mtc",
  connectString: "192.168.7.30:1521/MONGBILL",
},
  function (err, connection) {
    if (err) {
      console.error(err); return;
    }
    options.gconnection = connection;

    //eventEmitter.emit("select");
    eventEmitter.emit("allselect", 1, 20);

    //resolve("connection 완료");
  });
//})



function allselectHandler(o, p) {

  if (options.test1in != "" && options.updateTEST1CHARGEBool == true) {
    console.log("error choose one, -w or -a")
    return;
  }

  var allselectquery = `select * from (` + query + `) A where A.rnum between ${o} AND ${p}`;

  if (options.gconnection == null) {
    console.log("connection err");
    return;
  }



  options.gconnection.execute(allselectquery, function (err, result) {

    options.total = 0;

    if (err) {
      console.error(err.message);
      return;
    }

    if (typeof result.rows === "undefined") {
      console.log("END");
      return;
    }

    for (var i = 0; i < result.rows.length; i++) {

      var r = result.rows[i];
      var d = String(r[3]).substr(0, 10);

      //순서 EVENT_INST_ID, CALLING_NBR , CALLED_NBR , START_TIME , DURATION, CHARGE1, CHARGE2, TEST1, TEST1CHARGE
      var s = sprintf("%10s %10s %5s %4s %4s %4s %4s %5s %5s", r[0], r[1], r[2], d, r[4], r[5], r[6], r[7], r[8]);

      console.log(s);

      if (options.test1in != "") {
        eventEmitter.emit("update", options.test1in, r[0]);

      }

      var myenddate = new Date(Date.parse(r[3]) + (r[4] * 1000));


      //연 월 일 시 하나씩 가져오기
      var mystarttime = sprintf("%4d-%02d-%02dT%02d:%02d:%02d+%02d%02d", r[3].getFullYear(), r[3].getMonth(), r[3].getDate(), r[3].getHours(), r[3].getMinutes(), r[3].getSeconds(), r[3].getTimezoneOffset() / (-60), r[3].getTimezoneOffset() % 60);
      var myendtime = sprintf("%4d-%02d-%02dT%02d:%02d:%02d+%02d%02d", myenddate.getFullYear(), myenddate.getMonth(), myenddate.getDate(), myenddate.getHours(), myenddate.getMinutes(), myenddate.getSeconds(), myenddate.getTimezoneOffset() / (-60), myenddate.getTimezoneOffset() % 60);


      var mybody = {
        key: r[1],
        main_product: 'ub_ngn_p_3500',
        status: 11,
        balance: 0,
        dbSession: false,
        counters: [],
        serviceId: 'MOBILE_VOICE',
        callType: '',
        calling: r[1],
        startTime: mystarttime,
        called: r[2],
        endTime: myendtime,
        duration: r[4],
        origCellId: '101'
      }
      //리터럴로 하니까 안됨 ->


      myrequest.body = mybody;

      options.countr0.push(r[0]);


      //http request
      var UpdateRatingamt = function (ratingamt) {

        options.total++;

        options.ratingAmt.push(ratingamt);

        if (options.allselectBool)
          eventEmitter.emit("update", options.ratingAmt[0], options.countr0[0]);
        //eventEmitter.emit("update", 0, options.countr0[0]);

        options.ratingAmt.shift();
        options.countr0.shift();

        //console.log("rate" , options.ratingAmt);
        //console.log("count", options.countr0);


        if (options.total == 20) {
          eventEmitter.emit("allselect", o + 20, p + 20);
        }
      }

      var RequestPromise = new promise(function (resolve, reject) {
        request(myrequest, function (error, response, body) {
          if (error)
            reject(error);
          else
            resolve(body.cdr.ratingAmt);
          //console.log("a", body.cdr.ratingAmt);
        });
      }).then(UpdateRatingamt);



      /*
      
              request(myrequest, function (error, response, body) {
      
                options.total++;
      
                if (error)
                  console.log(error);
      
                //update 이벤트 호출
      
                options.ratingAmt.push(body.cdr.ratingAmt);
      
      
                if (options.allselectBool)
                  eventEmitter.emit("update", options.ratingAmt[0], options.countr0[0]);
                  //eventEmitter.emit("update", 0, options.countr0[0]);
      
                options.ratingAmt.shift(body.cdr.ratingAmt);
                options.countr0.shift(body.cdr.ratingAmt);
      
      
                //console.log("request body : ", body);
      
      
                if (options.total == 20) {
                  eventEmitter.emit("allselect", o + 20, p + 20);
                }
      
      
      
                return 1;
              });
      */
    }
    console.log("------------");

  });
}



function updateHandler(o, p) {
  if (options.gconnection == null) {
    console.log("updateHandler connection err");
    return;
  }

  if (options.test1in != "") {
    options.updatequery = ` update event_cdr_567 set test1 = '${o}' where event_inst_id = '${p}'`
  }

  if (options.updateTEST1CHARGEBool == true) {
    options.updatequery = ` update event_cdr_567 set TEST1CHARGE = '${o}' where event_inst_id = '${p}'`
  }



  options.gconnection.execute(options.updatequery, function (err, result) {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log("update complete", o, p);

  })

}



