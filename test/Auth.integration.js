var assert = require('assert');
var rest = require('restler');
var base = 'http://localhost:9201';

var Maki = require('maki');
var maki = new Maki({
  services: {
    http: {
      port: 9201
    }
  },
  database: {
    name: 'maki-auth-simple-test'
  }
});

var Auth = require('../');
var auth = new Auth();

maki.use(auth);

maki.define('Accessible', {
  attributes: {
    name: { type: String }
  }
});

maki.define('Inaccessible', {
  auth: {
    'create': function() {
      var context = this;
      return context.headers.authorization === 'somecredential';
    },
    'destroy': 'admin'
  },
  attributes: {
    name: { type: String }
  }
});

maki.start();

describe('Auth', function() {
  
  before(function(ready) {
    setTimeout(function() {
      ready();
    }, 1900);
  });

  it('should allow creation of normal resources', function(done) {
    rest.post(base+'/accessibles', {
      data: {
        name: 'foo'
      },
      headers: {
        Accept: 'application/json'
      }
    }).on('complete', function(data, res) {
      assert.equal(res.statusCode, 200);
      done();
    });
  });

  it('should disallow creation of authorization-required resources', function(done) {
    rest.post(base+'/inaccessibles', {
      data: {
        name: 'foo'
      },
      headers: {
        Accept: 'application/json'
      }
    }).on('complete', function(data, res) {
      assert.equal(res.statusCode, 403);
      done();
    });
  });

  it('should allow creation of authorization-required resources when authorized', function(done) {
    rest.post(base+'/inaccessibles', {
      data: {
        name: 'foo'
      },
      headers: {
        Accept: 'application/json',
        Authorization: 'somecredential'
      }
    }).on('complete', function(data, res) {
      assert.equal(res.statusCode, 200);
      done();
    });
  });

  it('should disallow creation of authorization-required resources when incorrectly authorized', function(done) {
    rest.post(base+'/inaccessibles', {
      data: {
        name: 'foo'
      },
      headers: {
        Accept: 'application/json',
        Authorization: 'someWRONGcredential'
      }
    }).on('complete', function(data, res) {
      assert.equal(res.statusCode, 403);
      done();
    });
  });

});
