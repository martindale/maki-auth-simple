var Auth = function(config) {
  if (!config) var config = {};

  var self = this;
  self.config = config;
  self.capabilityMap = {};

  var resources = {};
  if (self.config.resource) {
    var roleDef = { type: String };
    
    if (self.config.roles) {
      roleDef.enum = [self.config.roles];
    }
    
    if (self.config.default) {
      roleDef.default = self.config.default;
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
  
  if (self.config.capabilities) {
    // TODO: replace with underscore, which we might need anyway
    Object.keys(self.config.capabilities).forEach(function(capability) {
      var role = self.config.capabilities[capability];
      self.capabilityMap[role] = capability;
    });
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
                maki.services.http._pre[method] = function(req, res, next) {
                  if (!req.resource.options.auth) {
                    return next();
                  }

                  if (!(test instanceof Array)) {
                    test = [test];
                  }

                  //for (r of test) {
                  for (var i = 0; i < test.length; i++) {
                    var r = test[i];
                    if (r.apply && r.apply(req) === true) {
                      return next();
                    }
                  }

                  if (!(req.roles instanceof Array)) {
                    return res.status(403).end();
                  } else if (~req.roles.indexOf(r)) {
                    return next();
                  }

                  return res.status(403).end();
                };
              });
            }
          });
        },
        middleware: function(req, res, next) {
          if (req.user && !req.identity) {
            req.identity = req.user;
          } else if (!req.identity) {
            req.identity = {};
          }

          req.roles = req.identity.roles || [];
          req.capabilities = [];

          req.roles.forEach(function(role) {
            if (self.capabilityMap[role]) {
              // TODO: deal with arrays (maybe)
              req.capabilities.push(self.capabilityMap[role]);
            }
          });

          if (req.user) {
            req.user.roles = req.roles;
            req.user.capabilities = req.capabilities;
          }

          next();
        }
      }
    }
  };
}

Auth.prototype.role = function(name, props) {
  
};

module.exports = Auth;
