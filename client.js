/*
 */

var dgram   = require('dgram')
  , util    = require('util')
  , events  = require('events');

var fn_null = function(){};

var Client = function(params){

  params = params || {};

  this.port   = params.port || '8125';
  this.host   = params.host || 'localhost';

  this.prefix = params.prefix ? (params.prefix + '.') : '';

  ////////////////////////////////////////
  // check if we'll use a tunnel...
  if (params.tunnel){
    this.send = tunnel(params.tunnel);
  }

  // TODO: have a module level pool.
  this.client = dgram.createSocket("udp4");

};


Client.prototype.count = function(name, count, interval){

  var str = this.prefix + name + ':' + count + '|c' + (interval ? '|@' + interval : '');
  var buf = new Buffer(str);

  this.send(buf);

};

Client.prototype.timing = function(name, timing){

  var str = this.prefix + name + ':' + timing + '|ms';
  var buf = new Buffer(str);

  this.send(buf);

};

Client.prototype.gauge = function(name,val, incr, cb){

  var str = this.prefix + name + ':' + val + '|g' + (incr ? '|' + incr : '');
  var buf = new Buffer(str);

  this.send(buf, cb);

};

Client.prototype.send = function(buf, cb){
  this.client.send(buf, 0, buf.length, this.port, this.host, function(err, bytes){
    if (cb){
      cb();
    }
  });
};

var StatObj = function(params){

  if (!params){
    throw "Need a client object";
    return;
  }

  var that = this;

  events.EventEmitter.call(this);

  this.stats  = params.client;

  this.gauges = {};

  //return this;
  var me = this;
  this.cleanup = function(cb){
    removeExitEvents();

    if (!Object.keys(me.gauges).length && cb) {
      cb();
      return;
    }

    var cbs = 0;
    var localcb = function () {
      if ((--cbs) === 0){
        if (cb){
          cb();
        }
      }
    };

    // try and reset all gauges to 0
    for(var itr in me.gauges){
      cbs++;
      me.stats.gauge(itr,0, localcb);
    }
  };

  var errorCleanUp = function(err){
    that.cleanup(function(){
      throw err;
    });
  };

  addExitEvents();

  function addExitEvents(){
    process.on('uncaughtException', errorCleanUp);
  }

  function removeExitEvents(){
    process.removeListener('uncaughtException',errorCleanUp);
  }
};

util.inherits(StatObj, events.EventEmitter);

////////////////////////////////////////////
// Adds a gauge value. Initialises the gauge 
// to 0
StatObj.prototype.addGauge = function(name,startVal, bStatic){

  // create a getter/setter for the name
  // Example of an object property added with defineProperty with a data property descriptor
  var val =  startVal? startVal: 0;
  var fullName = this.stats.prefix + name;

  this.emit('change', {name:fullName, value:val});

  Object.defineProperty(this, name,
    {enumerable : true,
     configurable : true,
     get : function(){ return val;},
     set : function(newval){ 
      if (val != newval){
        val = newval;
        this.stats.gauge(name,val);

        this.emit('change', {name:fullName, value:newval});
      }}
    }
  );

  if (bStatic){
    // replace the setter, but keep the rest the same
    this.__defineSetter__(name, function(newval){

      if (val != newval){
        var dir = val > newval ? 'decr' : 'incr';
        var iters = Math.abs(newval-val);
        for (var itr =0; itr < iters ; itr++){
          this.stats.gauge(name,1,dir);
        }
        val = newval;
        this.emit('change', {name:fullName, value:newval});
      }
    });
  }

  // just keep track of the gauges we have for clean up later
  this.gauges[name] = 1;
};

StatObj.prototype.removeGauge = function(name){

  if (name in this.gauges){
    delete this.gauges[name];
    delete this[name];
  }
};

StatObj.prototype.count = function(name,val){

  val = val || 1;
  this.stats.count(name,val);
  this.emit('change', {name:name, value:val});

};

StatObj.prototype.getTimer = function(name){

  var me = this;
  var timer = {};

  timer.value = 0;
  timer.start = function(){
    timer.starttime = (new Date()).getTime();
  };

  timer.stop = function(){
    timer.value = (new Date()).getTime() - timer.starttime;
    me.stats.timing(name,timer.value);
    me.emit('change', {name:name, value:timer.value});
  };

  return timer;
};

function tunnel(params){

  // we currently only support redis tunneling
  if (params.type != 'redis'){
    throw('We only support redis tunnels')
  }

  Redis   = require('redis');
  var db = Redis.createClient(params.port, params.host, params.options);

  return function(buf){
    db.rpush(['statsd-tunnel', buf], fn_null);
  }

}

module.exports.client = function(params){
  return new Client(params);
};

module.exports.statsObj = function(params){
  return new StatObj(params);
};
