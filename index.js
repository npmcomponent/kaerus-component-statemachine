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

	var _state, _next;

	Object.defineProperty(machine,'state',{
		enumerable: false,
		get: function(){
			return _state;
		},
		set: function(state){
			if(!state) return;
			machine._status = PENDING;
			_state = _next;
			_next = state;
			machine.emit("transit",machine.action,state);
			return _state = _next;
		}
	});

	var _action;

	Object.defineProperty(machine,'action',{
		enumerable: false,
		get: function(){
			return _action;
		},
		set: function(action){
			return _action = action;
		}
	});

	/* check legality of state transit before propagation */
	machine.before("transit",function(action,state){
		if(!this.can(this.action,this.state,action,state)){
			machine.emit("error","illegal action for state");
			return false;
		} 
	});

	/* propagate state to action */
	machine.on("transit",function(action,state){
		console.log("transit %s from %s to state", action, machine.state, state);
		machine.emit(action,state);
	});

	/* transit completed */
	machine.after("transit",function(action,state){
		if(!machine._status) {
			machine._status = OK;
		} 	
	});

	/* error handler */
	machine.on("error",function(message){
		machine._status = ERROR;
		console.log("statemachine error:", message);
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
	this.status = PENDING;
	this.action = action;
	this.state = state;

	return this;
}

Statemachine.prototype.for = function(action){
	return this._rules[action];
}

Statemachine.prototype.can = function(action1,from,action2,to){
	var states1, states2;

	if(!action1) states1 = this._rules[this.action]._states;
	else if(!(states1 = this._rules[action1]._states)) return false;

	if(!action2) states2 = states1;
	else if(!(states2 = this._rules[action2]._states)) return false;

	function canDo(to,state){
		if(!to) 
			return true;
		else if(!Array.isArray(state) && state.to === to)
			return true;
		else {
			for(var i = 0, l = state.length; i < l; i++){
				if(state[i].to === to)
					return true;
			}
		}
		return false;
	}

	/* consciously a little sloppy */
	if(!Array.isArray(states1)){
		if(states1.from.indexOf(from)>=0){
			return canDo(to,states2);
		} 
	} else {
		for(var i = 0, l = states1.length; i < l; i++){
			if(states1[i].from.indexOf(from)>=0) {
				if(canDo(to,states2)) return true;
			}	
		}
	}

	return false;	
}

Statemachine.prototype.next = function(){
	var next_state = getNext(this.action,this.state);

	this.state = next_state;

	return this;
}

function getNext(action,from){
	var next_state;

	if(!Array.isArray(action._states)){
		if(action._states.from.indexOf(from)>=0)
			next_state = action._states.to;
	} else {
		for(var i = 0, l = action._states.length; i < l; i++){
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
			machine.state = state || getNext(action,machine.state);

			return action;
		}

		this.on(rule,function(state){
			if(action.hasListeners(state)) action.emit(state,next);
			else next();
			
			function next(next_state){		
				if(!next_state) next_state = getNext(action,state);

				if(next_state) machine.state = next_state;
			}
		});

	}	

	return this;
}


module.exports = Statemachine