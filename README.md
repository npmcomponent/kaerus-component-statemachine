<pre> 
	  S    
      t   M      
	StateMachine
      t   c    
      e   h    
      Machine 
          n
      State
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

myMachine.define("liftoff",[
	{from:"rumbling",to:"lifting"},
	{from:"lifting",to:"accelerating"},
	{from:"accelerating",to:"shutdown"}
]);

myMachine.define("orbit",[
	{from:"shutdown",to:"checkpath"},
	{from:"checkpath",to:"adjust"},
	{from:"adjust",to:"shutdown"}
]);

/* define events */
myMachine.for("ignition")
	.on("starting",function(next){ console.log("starting"); next(); })
	.on("rumbling",function(next){ 
		console.log("rumbling"); 
		if(myMachine._from === 'shaking') myMachine.liftoff();
		else next(); 
	}).on("shaking",function(next){ console.log("shaking"); next("rumbling"); });

myMachine.for("liftoff")
	.on("rumbling",function(next){ next() })
	.on("lifting",function(next){ console.log("lifting"); next() })
	.on("accelerating",function(next){ console.log("gaining speed"); next() })
	.on("shutdown",function(){console.log("shutting down"); myMachine.orbit()});

/* .......... */

/* initialize state and run */
myMachine.init("ignition","starting").run();
```
