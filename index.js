var Emitter = require('emitter');

/* machine statuses */
var OK = 1, ERROR = -1, PENDING = 0;

function Statemachine(mixin){
	var machine = this;

	machine._status = PENDING;
	machine._rules = {};

	Object.defineProperty(this,'state',{
		_state: null,
		enumerable: false,
		get: function(){
			return this._state;
		},
		set: function(state){
			machine._status = PENDING;
			machine._from = this._state;
			this._state = state;
			machine.emit("transit",machine.action,state);
			return this._state;
		}
	});

	Object.defineProperty(this,'action',{
		_action: null,
		enumerable: false,
		get: function(){
			return this._action;
		},
		set: function(action){
			return this._action = action;
		}
	});

	Emitter.call(machine,mixin);

	/* check legality of state transit before propagation */
	machine.before("transit",function(action,state){

		if(!machine._rules[action]){
			machine.emit("error",action,state,"no rules for action");

			return false;
		} 
	});

	/* propagate state to action */
	machine.on("transit",function(action,state){
		console.log("transit %s from %s to state", action, machine._from, state);
		machine.emit(action,state);
	});

	/* transit completed */
	machine.after("transit",function(action,state){
		if(!machine._status) {
			machine._status = OK;
		} 	
	});

	/* error handler */
	machine.before("error",function(action,state,message){
		machine._status = ERROR;
		console.log("state error for %s from %s to %s:", action, machine._from, state, message);
	});
}

inherit(Statemachine,Emitter);

/* Prototypal inheritance */
function inherit(self, parent) {
    self.super_ = parent;
    self.prototype = Object.create(parent.prototype, {
            constructor: {
                value: self,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
}

Statemachine.prototype.initial = function(action,state){
	this._rules._default = action;
	this._rules._initial = state;

	return this;
}

Statemachine.prototype.reset = function(){
	this.action = this._rules._default;
	this.state = this._rules._initial;

	return this;
}

Statemachine.prototype.for = function(action){
	return this._rules[action];
}

Statemachine.prototype.define = function(action,from,to){
	var transit = to ? {from:from, to:to} : from,
		rule = this._rules[action], machine = this;
	
	if(!rule){
		/* each rule set has its own events */
		rule = this._rules[action] = new Emitter();
		rule._states = transit;
	} else {
		if(!Array.isArray(rule._states))
			rules._states = [rule._states];

		if(Array.isArray(transit))
			rule._states.concat(transit);
		else		
			rule._states.push(transit);
	}

	if(!this[action]) {

		this[action] = function(state){
			machine.action = action;
			machine.state = state;
		}

		this.on(action,function(state){
			var next_state;

			rule.emit(state);

			if(!Array.isArray(rule._states)){
				if(rule._states.from.indexOf(state)>=0)
					next_state = rule._states.to;
			} else {
				for(var i = 0, l = rule._states.length; i < l; i++){
					if(rule._states[i].from.indexOf(machine._from)>=0) {
						next_state = rule._states[i].to;
						break;
					}	
				}
			}
			
			console.log("next_state", next_state);

			if(next_state) machine.state = next_state;
		});

	}	

	return this;
}


module.exports = Statemachine