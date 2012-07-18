/*
 */

var dgram = require('dgram');


var Client = function(params){

  params = params || {};

  this.port = params.port || '8125';
  this.host = params.host || 'localhost';

  ////////////////////////////////////////
  // create a new class with a UDP connection
  this.client = dgram.createSocket("udp4");

  //return this;

}


Client.prototype.count = function(name, count, interval){

  var str = name + ':' + count + '|c' + (interval ? '|@' + interval : '');
  var buf = new Buffer(str);

  this.send(buf);

};

Client.prototype.timing = function(name, timing){

  var str = name + ':' + timing + '|ms';
  var buf = new Buffer(str);

  this.send(buf);

};

Client.prototype.gauge = function(name,val, incr){

  var str = name + ':' + val + '|g' + (incr ? '|' + incr : '');
  var buf = new Buffer(str);

  this.send(buf);

};

Client.prototype.send = function(buf){

  this.client.send(buf, 0, buf.length, this.port, this.host);

};

exports = module.exports = function(params){
  return new Client(params);
};
