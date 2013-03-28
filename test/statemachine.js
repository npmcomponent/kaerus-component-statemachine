var SM = require('..');

describe('Statemachine', function(){
  describe('constructor', function(){
    it('should create object', function(){
      var sm = new SM;
      
      sm.should.be.a('object');
      sm.should.have.property('_status');
      sm.should.have.property('_rules');
      sm.should.have.property('_events');
      
    })

    it('should mixin object',function(){
      var obj = {test:true};

      SM(obj);

      obj.should.have.property('_status');
      obj.should.have.property('_rules');
      obj.should.have.property('_events');
      obj.should.have.property('test').and.equal(true);
    })
  })

  describe("define(test,'one','two')",function(){
    var sm = new SM;
    sm.define("test",'one','two');

    it('should have _rules',function(){
      sm.should.have.property('_rules'); 
    })

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

  })

  describe('define variants',function(){
    it('should create a single rule',function(){
      var sm = new SM;

      sm.define('test','one','two');
      sm._rules.test._states.should.be.a('object').and.eql({from:'one',to:'two'});
    })

    it('should create a rule by object',function(){
      var sm = new SM;

      var define = {from:'one',to:'two'};

      sm.define('test',define);
      sm._rules.test._states.should.be.a('object').and.eql(define);
    })

    it('should create an array of rules',function(){
      var sm = new SM;

      var defines = [
        {from:'one',to:'two'},
        {from:'two',to:'three'}
      ];

      sm.define('test',defines);
      sm._rules.test._states.should.be.a('object').and.eql(defines);
    })

    it('should create a rule with multiple from entries',function(){
      var sm = new SM;

      var define = {from:['one','two'],to:'three'};
      sm.define('test',define);
      sm._rules.test._states.should.eql(define);
    })
  })
})  
