var Auth = function(config) {
  if (!config) var config = {};

  var self = this;
  self.config = config;

  var resources = {};
  if (self.config.resource) {
    var roleDef = { type: String };
    
    if (self.config.roles) {
      roleDef.enum = [self.config.roles];
    }
    
    resources[ self.config.resource ] = {
      plugin: function(schema, options) {
        schema.add({ roles: [roleDef] });
      },
      modifier: function( options ) {
        options.attributes.roles = [roleDef];
        return options;
      }
    };
  }
  
  self.extends = {
    resources: resources,
    services: {
      http: {
        setup: function(maki) {
          Object.keys(maki.resources).forEach(function(name) {
            var resource = maki.resources[name];
            if (resource.options.auth) {
              Object.keys(resource.options.auth).forEach(function(method) {
                var test = resource.options.auth[method];
                var map = maki.services.http.invertedMap;
                maki.services.http._pre[ map[method] ] = function(req, res, next) {
                  if (!(req.roles instanceof Array)) {
                    return res.status(403).error();
                  }

                  if (!(test instanceof Array)) {
                    test = [test];
                  }
                  
                  //for (r of test) {
                  for (var i = 0; i < test.length; i++) {
                    var r = test[i];
                    if (r.apply && r() === true) {
                      return next();
                    }
                    if (~req.roles.indexOf(r)) {
                      return next();
                    }
                  }

                  return res.status(403).error();
                };
              });
            }
          });
        },
        middleware: function(req, res, next) {
          if (!req.identity) {
            req.identity = {};
          }
          req.roles = req.identity.roles;
          next();
        }
      }
    }
  };
}

Auth.prototype.role = function(name, props) {
  
};

module.exports = Auth;
