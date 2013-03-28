var Emitter = require('emitter');

/* machine status */
var PENDING = 0, OK = 1, ERROR = -1;

function Statemachine(mixin){
	var machine = mixin || this;

	if(mixin) {
        for(var key in Statemachine.prototype) {
            mixin[key] = Statemachine.prototype[key];
        }
        machine = mixin;
        machine._events = {};
    }

    Emitter.call(machine);

	machine._status = PENDING;
	machine._rules = {};

	Object.defineProperty(machine,'state',{
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

	Object.defineProperty(machine,'action',{
		_action: null,
		enumerable: false,
		get: function(){
			return this._action;
		},
		set: function(action){
			return this._action = action;
		}
	});

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

	return machine;
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

Statemachine.prototype.init = function(action,state){
	this._rules._default = action;
	this._rules._initial = state;

	return this;
}

Statemachine.prototype.reset = function(){
	this.action = this._rules._default;
	this.state = this._rules._initial;
	this._status = PENDING;

	return this;
}

Statemachine.prototype.run = function(){
	if(!this._status) this.reset();
	else this.state = this.state;

	return this;
}

Statemachine.prototype.for = function(action){
	return this._rules[action];
}

function getNext(action,from,state){
	var next_state;

	if(!Array.isArray(action._states)){
		if(action._states.from.indexOf(state)>=0)
			next_state = action._states.to;
	} else {
		for(var i = 0, l = rule._states.length; i < l; i++){
			if(action._states[i].from.indexOf(from)>=0) {
				next_state = action._states[i].to;
				break;
			}	
		}
	}

	return next_state;
}

Statemachine.prototype.define = function(rule,from,to){
	var transit = to ? {from:from, to:to} : from,
		action = this._rules[rule], machine = this;
	
	if(!action){
		/* each rule set has its own events */
		action = this._rules[rule] = new Emitter();
		action._states = transit;
	} else {
		if(!Array.isArray(action._states))
			action._states = [action._states];

		if(Array.isArray(transit))
			action._states.concat(transit);
		else		
			action._states.push(transit);
	}

	if(!this[rule]) {

		this[rule] = function(state){
			machine.action = rule;
			machine.state = state;
		}

		this.on(rule,function(state){

			action.emit(state,next);

			function next(next_state){
				if(!next_state) next_state = getNext(action,machine._from,state);
				if(next_state) machine.state = next_state;
			}
		});

	}	

	return this;
}


module.exports = Statemachine