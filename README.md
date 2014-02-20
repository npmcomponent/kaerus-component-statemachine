*This repository is a mirror of the [component](http://component.io) module [kaerus-component/statemachine](http://github.com/kaerus-component/statemachine). It has been modified to work with NPM+Browserify. You can install it using the command `npm install npmcomponent/kaerus-component-statemachine`. Please do not open issues or send pull requests against this repo. If you have issues with this repo, report it to [npmcomponent](https://github.com/airportyh/npmcomponent).*
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
	{from:undefined,to:"starting"}, // from init
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
		if(myMachine.state === 'shaking') myMachine.liftoff();
		else next(); 
	})
	.on("shaking",function(next){ console.log("shaking"); next("rumbling"); });

myMachine.for("liftoff")
	.on("rumbling",function(next){ next() })
	.on("lifting",function(next){ console.log("lifting"); next() })
	.on("accelerating",function(next){ console.log("gaining speed"); next() })
	.on("shutdown",function(){console.log("shutting down"); myMachine.orbit()});

/* .......... */

/* initializes state and runs machine */
myMachine.start("ignition","starting");
```

License
=======
```
Copyright (c) 2013 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
    http://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
