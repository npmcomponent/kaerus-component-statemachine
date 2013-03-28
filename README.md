<pre>     
          M
	Statemachine
          c
          h
          i
          n
          e
</pre>

Usage
=====
```javascript
var Statemachine = require('statemachine');

var myMachine = {};

/* make myMachine a statemachine */
Statemachine(myMachine); 

/* define states */
myMachine.define("ignition",[
	{from:"starting",to:"rumbling"},
	{from:"rumbling",to:"shaking"},
	{from:"shaking",to:"rumbling"}
]);

/* define events */
myMachine.for("ignition")
	.on("starting",function(next){ console.log("starting"); next(); });
	.on("rumbling",function(next){ console.log("rumbling"); next(); });
	.on("shaking",function(next){ console.log("shaking"); next("rumbling"); });

/* define initial state */
myMachine.init("ignition","starting").run();
```
