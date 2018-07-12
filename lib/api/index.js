'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _methods = require('./methods');

var _methods2 = _interopRequireDefault(_methods);

var _transports = require('./transports');

var _transports2 = _interopRequireDefault(_transports);

var _utils = require('../utils');

var _ecc = require('../auth/ecc');

var _serializer = require('../auth/serializer');

var _http = require('./transports/http');

var _rpcAuth = require('@steemit/rpc-auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var auth = require('../auth');

var Steem = function (_EventEmitter) {
    _inherits(Steem, _EventEmitter);

    function Steem() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Steem);

        var _this = _possibleConstructorReturn(this, (Steem.__proto__ || Object.getPrototypeOf(Steem)).call(this, options));

        _this._setTransport(options);
        _this._setLogger(options);
        _this.options = options;
        _this.seqNo = 0; // used for rpc calls
        _methods2.default.forEach(function (method) {
            var methodName = method.method_name || (0, _utils.camelCase)(method.method);
            var methodParams = method.params || [];

            _this[methodName + 'With'] = function (options, callback) {
                return _this.send(method.api, {
                    method: method.method,
                    params: methodParams.map(function (param) {
                        return options[param];
                    })
                }, callback);
            };

            _this[methodName] = function () {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var options = methodParams.reduce(function (memo, param, i) {
                    memo[param] = args[i]; // eslint-disable-line no-param-reassign
                    return memo;
                }, {});
                var callback = args[methodParams.length];
                return _this[methodName + 'With'](options, callback);
            };

            _this[methodName + 'WithAsync'] = _bluebird2.default.promisify(_this[methodName + 'With']);
            _this[methodName + 'Async'] = _bluebird2.default.promisify(_this[methodName]);
        });
        _this.callAsync = _bluebird2.default.promisify(_this.call);
        _this.signedCallAsync = _bluebird2.default.promisify(_this.signedCall);
        return _this;
    }

    _createClass(Steem, [{
        key: '_setTransport',
        value: function _setTransport(options) {
            if (options.url && options.url.match('^((http|https)?:\/\/)')) {
                options.uri = options.url;
                options.transport = 'http';
                this._transportType = options.transport;
                this.options = options;
                this.transport = new _transports2.default.http(options);
            } else if (options.url && options.url.match('^((ws|wss)?:\/\/)')) {
                options.websocket = options.url;
                options.transport = 'ws';
                this._transportType = options.transport;
                this.options = options;
                this.transport = new _transports2.default.ws(options);
            } else if (options.transport) {
                if (this.transport && this._transportType !== options.transport) {
                    this.transport.stop();
                }

                this._transportType = options.transport;

                if (typeof options.transport === 'string') {
                    if (!_transports2.default[options.transport]) {
                        throw new TypeError('Invalid `transport`, valid values are `http`, `ws` or a class');
                    }
                    this.transport = new _transports2.default[options.transport](options);
                } else {
                    this.transport = new options.transport(options);
                }
            } else {
                this.transport = new _transports2.default.ws(options);
            }
        }
    }, {
        key: '_setLogger',
        value: function _setLogger(options) {
            if (options.hasOwnProperty('logger')) {
                switch (_typeof(options.logger)) {
                    case 'function':
                        this.__logger = {
                            log: options.logger
                        };
                        break;
                    case 'object':
                        if (typeof options.logger.log !== 'function') {
                            throw new Error('setOptions({logger:{}}) must have a property .log of type function');
                        }
                        this.__logger = options.logger;
                        break;
                    case 'undefined':
                        if (this.__logger) break;
                    default:
                        this.__logger = false;
                }
            }
        }
    }, {
        key: 'log',
        value: function log(logLevel) {
            if (this.__logger) {
                if (arguments.length > 1 && typeof this.__logger[logLevel] === 'function') {
                    var args = Array.prototype.slice.call(arguments, 1);
                    this.__logger[logLevel].apply(this.__logger, args);
                } else {
                    this.__logger.log.apply(this.__logger, arguments);
                }
            }
        }

        // start() {
        //     return this.transport.start();
        // }
        //
        // stop() {
        //     return this.transport.stop();
        // }

    }, {
        key: 'send',
        value: function send(api, data, callback) {
            var cb = callback;
            if (this.__logger) {
                var id = Math.random();
                var self = this;
                this.log('xmit:' + id + ':', data);
                cb = function cb(e, d) {
                    if (e) {
                        self.log('error', 'rsp:' + id + ':\n\n', e, d);
                    } else {
                        self.log('rsp:' + id + ':', d);
                    }
                    if (callback) {
                        callback.apply(self, arguments);
                    }
                };
            }
            return this.transport.send(api, data, cb);
        }
    }, {
        key: 'call',
        value: function call(method, params, callback) {
            if (this._transportType !== 'http') {
                callback(new Error('RPC methods can only be called when using http transport'));
                return;
            }
            var id = ++this.seqNo;
            (0, _http.jsonRpc)(this.options.uri, { method: method, params: params, id: id }).then(function (res) {
                callback(null, res);
            }, function (err) {
                callback(err);
            });
        }
    }, {
        key: 'signedCall',
        value: function signedCall(method, params, account, key, callback) {
            if (this._transportType !== 'http') {
                callback(new Error('RPC methods can only be called when using http transport'));
                return;
            }
            var id = ++this.seqNo;
            var request = void 0;
            try {
                request = (0, _rpcAuth.sign)({ method: method, params: params, id: id }, account, [key]);
            } catch (error) {
                callback(error);
                return;
            }
            (0, _http.jsonRpc)(this.options.uri, request).then(function (res) {
                callback(null, res);
            }, function (err) {
                callback(err);
            });
        }
    }, {
        key: 'setOptions',
        value: function setOptions(options) {
            Object.assign(this.options, options);
            this._setLogger(options);
            this._setTransport(options);
            this.transport.setOptions(options);
        }
    }, {
        key: 'setWebSocket',
        value: function setWebSocket(url) {
            this.setOptions({
                websocket: url
            });
        }
    }, {
        key: 'setUri',
        value: function setUri(url) {
            this.setOptions({
                uri: url
            });
        }
    }, {
        key: 'startBroadcasting',
        value: function startBroadcasting(transaction, private_key, callback) {
            var _this2 = this;

            try {
                return this.call('about', [''], function (err, response) {
                    if (err) callback(err, null);else {
                        console.log(response.chain_id);
                        _this2.call('get_transaction_digest', [transaction, response.chain_id], function (err, response) {
                            if (err) callback(err, null);else {
                                var sign = auth.createSignature(response, private_key);

                                _this2.call('add_signature', [transaction, sign], function (err, response) {
                                    if (err) callback(err, null);else {
                                        _this2.call('broadcast_transaction', [response], callback);
                                    }
                                });
                            }
                        });
                    }
                });
            } catch (ex) {
                console.log(ex);
            }
        }
    }, {
        key: 'createAccountTransaction',
        value: function createAccountTransaction(creator, seed, private_key, json_meta, owner, active, memo_key, callback) {
            var _this3 = this;

            return this.call('create_account', [creator, seed, json_meta, owner, active, memo_key], function (err, response) {
                if (err) callback(err, null);else {
                    _this3.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this3.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'updateAccountTransaction',
        value: function updateAccountTransaction(account_name, private_key, json_meta, owner, active, memo_key, callback) {
            var _this4 = this;

            return this.call('update_account', [account_name, json_meta, owner, active, memo_key], function (err, response) {
                if (err) callback(err, null);else {
                    _this4.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this4.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'deleteAccountTransaction',
        value: function deleteAccountTransaction(account_name, private_key, callback) {
            var _this5 = this;

            return this.call('delete_account', [account_name], function (err, response) {
                if (err) callback(err, null);else {
                    _this5.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this5.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'transferTransaction',
        value: function transferTransaction(from, to, amount, memo, private_key, callback) {
            var _this6 = this;

            return this.call('transfer', [from, to, amount, memo], function (err, response) {
                if (err) callback(err, null);else {
                    _this6.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this6.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'transferToVestingTransaction',
        value: function transferToVestingTransaction(from, to, amount, private_key, callback) {
            var _this7 = this;

            return this.call('transfer_to_vesting', [from, to, amount], function (err, response) {
                if (err) callback(err, null);else {
                    _this7.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this7.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'setVotingProxyTransaction',
        value: function setVotingProxyTransaction(account_to_modify, proxy, private_key, callback) {
            var _this8 = this;

            return this.call('set_voting_proxy', [account_to_modify, proxy], function (err, response) {
                if (err) callback(err, null);else {
                    _this8.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this8.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'voteForWitnessTransaction',
        value: function voteForWitnessTransaction(witness_to_vote_for) {
            var approve = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var _this9 = this;

            var private_key = arguments[2];
            var callback = arguments[3];

            return this.call('vote_for_witness', [witness_to_vote_for, approve], function (err, response) {
                if (err) callback(err, null);else {
                    _this9.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this9.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'withdrawVestingTransaction',
        value: function withdrawVestingTransaction(from, vesting_shares, private_key, callback) {
            var _this10 = this;

            return this.call('withdraw_vesting', [from, vesting_shares], function (err, response) {
                if (err) callback(err, null);else {
                    _this10.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this10.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }
    }, {
        key: 'updateWitnessTransaction',
        value: function updateWitnessTransaction(witness_name, url, block_signing_key, props, private_key, callback) {
            var _this11 = this;

            return this.call('update_witness', [witness_name, url, block_signing_key, props], function (err, response) {
                if (err) callback(err, null);else {
                    _this11.call('create_simple_transaction', [response], function (err, response) {
                        if (err) callback(err, null);else {
                            _this11.startBroadcasting(response, private_key, callback);
                        }
                    });
                }
            });
        }

        // streamBlockNumber(mode = 'head', callback, ts = 200) {
        //     if (typeof mode === 'function') {
        //         callback = mode;
        //         mode = 'head';
        //     }
        //     let current = '';
        //     let running = true;
        //
        //     const update = () => {
        //         if (!running) return;
        //
        //         this.getDynamicGlobalPropertiesAsync().then(
        //             result => {
        //                 const blockId = mode === 'irreversible' ?
        //                     result.last_irreversible_block_num :
        //                     result.head_block_number;
        //
        //                 if (blockId !== current) {
        //                     if (current) {
        //                         for (let i = current; i < blockId; i++) {
        //                             if (i !== current) {
        //                                 callback(null, i);
        //                             }
        //                             current = i;
        //                         }
        //                     } else {
        //                         current = blockId;
        //                         callback(null, blockId);
        //                     }
        //                 }
        //
        //                 Promise.delay(ts).then(() => {
        //                     update();
        //                 });
        //             },
        //             err => {
        //                 callback(err);
        //             },
        //         );
        //     };
        //
        //     update();
        //
        //     return () => {
        //         running = false;
        //     };
        // }


        // streamBlock(mode = 'head', callback) {
        //     if (typeof mode === 'function') {
        //         callback = mode;
        //         mode = 'head';
        //     }
        //
        //     let current = '';
        //     let last = '';
        //
        //     const release = this.streamBlockNumber(mode, (err, id) => {
        //         if (err) {
        //             release();
        //             callback(err);
        //             return;
        //         }
        //
        //         current = id;
        //         if (current !== last) {
        //             last = current;
        //             this.getBlock(current, callback);
        //         }
        //     });
        //
        //     return release;
        // }

        // streamTransactions(mode = 'head', callback) {
        //     if (typeof mode === 'function') {
        //         callback = mode;
        //         mode = 'head';
        //     }
        //
        //     const release = this.streamBlock(mode, (err, result) => {
        //         if (err) {
        //             release();
        //             callback(err);
        //             return;
        //         }
        //
        //         if (result && result.transactions) {
        //             result.transactions.forEach(transaction => {
        //                 callback(null, transaction);
        //             });
        //         }
        //     });
        //
        //     return release;
        // }
        //
        // streamOperations(mode = 'head', callback) {
        //     if (typeof mode === 'function') {
        //         callback = mode;
        //         mode = 'head';
        //     }
        //
        //     const release = this.streamTransactions(mode, (err, transaction) => {
        //         if (err) {
        //             release();
        //             callback(err);
        //             return;
        //         }
        //
        //         transaction.operations.forEach(operation => {
        //             callback(null, operation);
        //         });
        //     });
        //
        //     return release;
        // }
        // test(alarm){
        //     return alarm;
        // };
        // tester(){
        //     return this.test('Hello World');
        // };
        // broadcastTransactionSynchronousWith(options, callback) {
        // const trx = options.trx;
        // return this.send(
        //     'network_broadcast_api', {
        //         method: 'broadcast_transaction_synchronous',
        //         params: [trx],
        //     },
        //     (err, result) => {
        //         if (err) {
        //             const {
        //                 signed_transaction
        //             } = ops;
        //             //console.log('-- broadcastTransactionSynchronous -->', JSON.stringify(signed_transaction.toObject(trx), null, 2));
        //             // toObject converts objects into serializable types
        //             const trObject = signed_transaction.toObject(trx);
        //             const buf = signed_transaction.toBuffer(trx);
        //             err.digest = hash.sha256(buf).toString('hex');
        //             err.transaction_id = buf.toString('hex');
        //             err.transaction = JSON.stringify(trObject);
        //             callback(err, '');
        //         } else {
        //             callback('', result);
        //         }
        //     },
        // );
        //
        // }


    }]);

    return Steem;
}(_events2.default);

// Export singleton instance


var steem = new Steem(_config2.default);
exports = module.exports = steem;
exports.Steem = Steem;