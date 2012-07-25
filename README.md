statsd-node
===========

statsd nodejs client lib. including a couple of extensions to the default statsd API

Tunneling - statsd uses UDP ports by default which may not always be available. This client 
library will allow for tunneling via the mechanism of your choice. First tunneling implementation
uses Redis. 

Support for Incr/Decr on the gauge item.

Support for these extensions must exist on the statsd server you are using. You can find 
a supported server implementation in my fork of statsd here: 

https://github.com/Reregistered/statsd.git

