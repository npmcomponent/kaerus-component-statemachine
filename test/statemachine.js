var should = require('should'),
    SM = require('..');

describe('Statemachine', function(){
  describe('instance', function(){
    var sm = new SM;

    it('should have _status, _rules, _events, _state, _action', function(){
      sm.should.be.a('object');
      sm.should.have.property('_status');
      sm.should.have.property('_rules');
      sm.should.have.property('_events');
      sm.should.have.ownProperty('_state');
      sm.should.have.ownProperty('_action');
    })

    it('should have an initial state that is undefined',function(){
      var state = sm._state;
      should.not.exist(state);
    })

    it('should have an initial action that is undefined',function(){
      var action = sm._action;
      should.not.exist(action);
    })

    it('should have a transit event listener',function(){
      sm._events.should.have.property('transit');
    })

    it('should be able to mix into an object',function(){
      var obj = {test:true};

      SM(obj);

      obj.should.have.property('_status');
      obj.should.have.property('_rules');
      obj.should.have.property('_events');
      obj.should.have.property('test').and.equal(true);
    })
  })

  describe("define test",function(){
    var sm = new SM;
    sm.define("test",'one','two');

    it('should define test() action',function(){
       sm.test.should.be.a('function');
    })

    it('should have a test rule',function(){
      sm._rules.should.have.property('test'); 
    })

    it('should have _events and _states',function(){
      sm._rules.test.should.have.property('_events');
      sm._rules.test.should.have.property('_states');
    })

    it('should define from and to states',function(){
      sm._rules.test._states.should.eql({from:'one',to:'two'})
    })

   it('define with {from:,to:} should define a single entry',function(){
      var sm = new SM;

      var define = {from:'one',to:'two'};

      sm.define('test',define);
      sm._rules.test._states.should.be.a('object').and.eql(define);
    })

    it('define with [{from:,to:}] should create multiple entries',function(){
      var sm = new SM;

      var defines = [
        {from:'one',to:'two'},
        {from:'two',to:'three'}
      ];

      sm.define('test',defines);
      sm._rules.test._states.should.be.an.instanceOf(Array).and.eql(defines);
    })  

    it('define with {from:[],to:} should have multiple from entries',function(){
      var sm = new SM;

      var define = {from:['one','two'],to:'three'};
      sm.define('test',define);
      sm._rules.test._states.should.eql(define);
      sm._rules.test._states.from.should.be.an.instanceOf(Array);
      sm._rules.test._states.from.should.eql(['one','two']);
    })
  })
  describe("transit test",function(){
    var sm = new SM, test, rules;

    sm.define('test',[{from:undefined,to:'one'},{from:'one',to:'two'}]);

    it("should create test() method",function(){
      sm.test.should.be.a('function');
    })

    it("for('test') should return rules",function(){
      rules = sm.for('test');
      rules.should.be.a('object');
    })

    it("for('test').on('one',function(){}) should create event on 'one' state",function(){
      sm.for('test').on('one',function(){test = 1});
      rules._events.should.have.property('one');
    })

    it("start('test','one') should transit from 'undefined' to 'one'",function(){
      sm.start('test','one'); // action(test), state(undefined->one)
      var state = sm._state;
      state.should.equal('one');
      should.equal(test,1);
    })

    it("test('two') should transit state from 'one' to 'two'",function(){
      sm.for('test').on('two',function(){test = 2});
      sm.test('two');
      var state = sm._state;
      state.should.equal('two');
      should.equal(test,2);
    })


  });


})  
