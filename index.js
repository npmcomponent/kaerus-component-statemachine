var Emitter = require('kaerus-component-emitter');

/* machine status */
var STOP = 0, START = 1, ERROR = -1;

function Statemachine(mixin){
    var machine = this;

    if(mixin){
        for(var key in Statemachine.prototype){
            mixin[key] = Statemachine.prototype[key];
        }
        machine = mixin;
        /* fixme */
        machine._events = {};
    }

    Emitter.call(machine);

    machine._status = STOP;
    machine._rules = {};

    var state, temp, action;

    Object.defineProperty(machine,'_state',{
        enumerable: false,
        get: function(){
            return state;
        },
        set: function(value){
            if(!value) return;
            state = temp;
            temp = value;
            machine.emit("transit",action,value);
            return state = temp;
        }
    });

    Object.defineProperty(machine,'_action',{
        enumerable: false,
        get: function(){
            return action;
        },
        set: function(value){
            return action = value;
        }
    });

    /* check legality of state transit before propagation */
    machine.before("transit",function(action,state){
        if(this._status > 0){
            this._status++;
            if(!this.can(this._action,this._state,action,state)){
                this.emit("error","illegal transit from '" + this._state + 
                        "' to '" + state + "' for action '" + action + "'");
                return false;
            }
        } else return false;     
    });

    /* propagate state to action */
    machine.on("transit",function(action,state){
        //console.log("transit %s from %s to state", action, this._state, state);
        machine.emit(action,state);
    });

    /* transit completed */
    machine.after("transit",function(action,state){
        if(this.status > 0) this._status--;
        //else console.log("statemachine done");
    });

    /* error handler */
    machine.on("error",function(message){
        this._status = ERROR;
        console.log("statemachine error:", message);
    });

    return machine;
}

inherit(Statemachine,Emitter);

/* Prototypal inheritance */
function inherit(self, parent){
    self.super_ = parent;
    self.prototype = Object.create(parent.prototype,{
        constructor: {
            value: self,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}

Statemachine.prototype.init = function(action,state){
    this._status = STOP;
    this._action = action;
    this._state = state;

    return this;
}

Statemachine.prototype.stop = function(action,state){
    if(action) this._action = action;
    if(state) this._state = state;
    
    this._paused = this._status;
    this._status = STOP;

    return this;
}

Statemachine.prototype.start = function(action,state){
    this._action = action || this._action;
    this._status = this._paused || this._status || START;
    this._state = state || this._state;

    return this;
}

Statemachine.prototype.for = function(action){
    return this._rules[action];
}


function canDo(type,value,states){
    if(!Array.isArray(states) && states[type] === value)
        return true;
    else {
        for(var i = 0, l = states.length; i < l; i++){
            if(states[i][type] === value)
                return true;
        }
    }
    return false;
}

Statemachine.prototype.can = function(action1,from,action2,to){
    var states1, states2;

    if(!action1) states1 = this._rules[this._action]._states;
    else if(!(states1 = this._rules[action1]._states)) return false;

    if(!action2) states2 = states1;
    else if(!(states2 = this._rules[action2]._states)) return false;

    return (canDo('from',from,states1) && canDo('to',to,states2));  
}

Statemachine.prototype.next = function(){
    var next_state = getNext(this._action,this._state);

    this._state = next_state;

    return this;
}

function getNext(action,from){
    var next_state;

    function toState(from,state){
        if(!Array.isArray(from) && state.from === from)
            return state.to;
        else {
            if(from.indexOf(state.from)>=0)
                return state.to;
        }
    }

    if(!Array.isArray(action._states)){
        next_state = toState(from,action._states);
    } else {
        for(var i = 0, l = action._states.length; i < l; i++){
            if((next_state = toState(from,action._states[i]))){
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

    if(!this[rule]){

        this[rule] = function(state){
            machine._action = rule;
            machine._state = state || getNext(action,machine._state);

            return action;
        }

        this.on(rule,function(state){
            if(action.hasListeners(state)) action.emit(state,next);
            else next();

            function next(next_state){      
                if(!next_state) next_state = getNext(action,state);

                if(next_state) machine._state = next_state;
            }
        });

    }   

    return this;
}


module.exports = Statemachine