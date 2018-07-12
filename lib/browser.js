"use strict";

var api = require("./api");
var auth = require("./auth");
//const broadcast = require("./broadcast");
var config = require("./config");
//const formatter = require("./formatter")(api);
var utils = require("./utils");

var sophia = {
  api: api,
  auth: auth,
  config: config,
  utils: utils
};

if (typeof window !== "undefined") {
  window.sophia = sophia;
}

if (typeof global !== "undefined") {
  global.sophia = sophia;
}

exports = module.exports = sophia;