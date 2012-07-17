/*
 */

var dgram = require('dgram');

var client = exports.client = function(params){

  params = params || {};

  this.port = params.port || '8125';
  this.host = params.host || 'localhost';

  ////////////////////////////////////////
  // create a new class with a UDP connection
  this.client = dgram.createSocket("udp4");

  return this;

};


client.prototype.count = function(name, count, interval){

  var str = name + ':' + count + '|c' + (interval ? '|@' + interval : '');
  var buf = new Buffer(str);

  this.send(buf);

};

client.prototype.timing = function(name, timing){

  var str = name + ':' + timing + '|ms';
  var buf = new Buffer(str);

  this.send(buf);

};

client.prototype.gauge = function(name,val){

  var str = name + ':' + val + '|g';
  var buf = new Buffer(str);

  this.send(buf);

};

client.prototype.send = function(buf){

  this.client.send(buf, 0, buf.length, this.port, this.host);

};