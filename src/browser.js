const api = require("./api");
const auth = require("./auth");
//const broadcast = require("./broadcast");
const config = require("./config");
//const formatter = require("./formatter")(api);
const utils = require("./utils");

const sophia = {
  api,
  auth,
  config,
  utils
};

if (typeof window !== "undefined") {
  window.sophia = sophia;
}

if (typeof global !== "undefined") {
  global.sophia = sophia;
}

module.exports = sophia;
