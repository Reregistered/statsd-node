/*
 */
var params = {
  tunnel:{
    type:'redis',
    port:'6379',
    host:'localhost'
  }
};

var stat = require('./client.js')(params);

setInterval(function(){
  console.log('calling');
  stat.gauge('test',1,'incr');
},500);

setInterval(function(){
  console.log('calling');
  stat.gauge('test',2,'decr');
},1500);