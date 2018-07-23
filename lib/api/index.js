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

var _http = require('./transports/http');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var auth = require('../auth');

var Sophia = function (_EventEmitter) {
    _inherits(Sophia, _EventEmitter);

    function Sophia() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Sophia);

        var _this = _possibleConstructorReturn(this, (Sophia.__proto__ || Object.getPrototypeOf(Sophia)).call(this, options));

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

    _createClass(Sophia, [{
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

        /**
         * @param method -  method name
         * @param params - arguments
         * @param callback - callback function
         * @returns {object}
         */

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
                request = signRequest({ method: method, params: params, id: id }, account, [key]);
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
        /**
         * Broadcast transactions over the blockchain using users private key
         * @param operation - transaction generated by the operations
         * @param private_key - private key of the users account
         * @param callback
         * @returns {Transaction id and object}
         */

    }, {
        key: 'startBroadcasting',
        value: function startBroadcasting(operation, private_key, callback) {
            var _this2 = this;

            var chain_id = void 0;
            var transaction = void 0;
            try {
                return this.call('about', [''], function (err, response) {
                    if (err) callback(err, '');else {
                        chain_id = response.chain_id;
                        console.log('Transaction is being generated on chain id:' + chain_id);
                        _this2.call('calculate_fee', [operation, 'SPHTX'], function (err, response) {
                            if (err) callback(err, '');else {
                                console.log('Estimated fees for this transaction is:' + response);
                                _this2.call('add_fee', [operation, response], function (err, response) {
                                    if (err) {
                                        callback(err, '');
                                    } else {
                                        _this2.call('create_simple_transaction', [response], function (err, response) {
                                            if (err) callback(err, '');else {
                                                transaction = response;
                                                _this2.call('get_transaction_digest', [transaction, chain_id], function (err, response) {
                                                    if (err) callback(err, '');else {
                                                        var sign = auth.createSignature(response, private_key);

                                                        _this2.call('add_signature', [transaction, sign], function (err, response) {
                                                            if (err) callback(err, '');else {
                                                                _this2.call('broadcast_transaction', [response], function (err, response) {
                                                                    if (err) console.log(err);else {
                                                                        console.log('New transaction id is:' + response.transaction_id);
                                                                        callback('', response);
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
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
        /**
         * Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
         * @param creator - sponsor account with enough balance for creating an account
        * @param seed - account name (easy to remember)
        * @param private_key - Creator's private key
        * @param json_meta - json data (details about the account)
        * @param owner - Owner Key
        * @param active - Active Key
        * @param memo_key - Memo Key
        * @param callback
        * @returns {object}
        */

    }, {
        key: 'createAccount',
        value: function createAccount(creator, seed, private_key, json_meta, owner, active, memo_key, callback) {
            var _this3 = this;

            return this.call('create_account', [creator, seed, json_meta, owner, active, memo_key], function (err, response) {
                if (err) callback(err, '');else {
                    _this3.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Update ActiveKey, OwnerKey, MemoKey and JsonMetadata of the account using user's PrivateKey
         * @param account_name - account name (hash / System generated)
         * @param private_key - user's private key
         * @param json_meta - json data (details about the account)
         * @param owner - Owner Key
         * @param active - Active Key
         * @param memo_key - Memo Key
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'updateAccount',
        value: function updateAccount(account_name, json_meta, owner, active, memo_key, private_key, callback) {
            var _this4 = this;

            return this.call('update_account', [account_name, json_meta, owner, active, memo_key], function (err, response) {
                if (err) callback(err, null);else {
                    _this4.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Delete account using user's PrivateKey
         * @param account_name - name of the account to be deleted
         * @param private_key - user's private key
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'deleteAccount',
        value: function deleteAccount(account_name, private_key, callback) {
            var _this5 = this;

            return this.call('delete_account', [account_name], function (err, response) {
                if (err) callback(err, '');else {
                    _this5.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Transfer an amount (in the form of "amount (space) currencySymbol i.e 10.000 SPHTX") to other account with a memo (receipt/details) attached to the transfer using Sender's Priavtekey.
         * @param from - account name of sender
         * @param to - account name of receiver
         * @param amount - amount to be transferred
         * @param memo - encrypted memo to be transferred along with the amount
         * @param private_key - private key of the user
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'transfer',
        value: function transfer(from, to, amount, memo, private_key, callback) {
            var _this6 = this;

            return this.call('transfer', [from, to, amount, memo], function (err, response) {
                if (err) callback(err, '');else {
                    _this6.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Transfer amount (in the form of "amount currencySymbol, 10.000 SPHTX") to Vesting.
         * @param from - sender's account name
         * @param to - receiver's account name
         * @param amount - amount to be transferred
         * @param private_key - sender's private key
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'transferToVesting',
        value: function transferToVesting(from, to, amount, private_key, callback) {
            var _this7 = this;

            return this.call('transfer_to_vesting', [from, to, amount], function (err, response) {
                if (err) callback(err, '');else {
                    _this7.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Set a proxy account for doing votes on behalf of first account.
         * @param account_to_modify - main account name
         * @param proxy - proxy account name
         * @param private_key - private key of the main account
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'setVotingProxy',
        value: function setVotingProxy(account_to_modify, proxy, private_key, callback) {
            var _this8 = this;

            return this.call('set_voting_proxy', [account_to_modify, proxy], function (err, response) {
                if (err) callback(err, '');else {
                    _this8.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Vote for a witness using witness name and voter's PrivateKey
         * @param witness_to_vote_for - account name of the witness
         * @param approve - True for positive vote and false for negative vote to the witness
         * @param private_key - private key of the user
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'voteForWitness',
        value: function voteForWitness(accountToVoteWith, witness_to_vote_for) {
            var approve = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var _this9 = this;

            var private_key = arguments[3];
            var callback = arguments[4];

            return this.call('vote_for_witness', [accountToVoteWith, witness_to_vote_for, approve], function (err, response) {
                if (err) callback(err, '');else {
                    _this9.startBroadcasting(response, private_key, callback);
                }
            });
        }
        /**
         * Withdraw amount (in the form of "amount currencySymbol, 10.000 SPHTX") from Vesting in fractions.
         * @param from - users account name
         * @param vesting_shares - amount to be be withdrawn from vesting account
         * @param private_key - user's private key
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'withdrawVesting',
        value: function withdrawVesting(from, vesting_shares, private_key, callback) {
            var _this10 = this;

            return this.call('withdraw_vesting', [from, vesting_shares], function (err, response) {
                if (err) callback(err, '');else {
                    _this10.startBroadcasting(response, private_key, callback);
                }
            });
        }

        /**
         * Update witness account with maximum block size greater than minimum block size of 1024*64 and array of Prize feeds
         * @param account_name - account name of the user wishes to be witness
         * @param url - url of the description published online about the user
         * @param block_signing_key - users public key for signing the blocks
         * @param accountCreationFee - account creation fees
         * @param maximumBlockSizeLimit - maximum block size limit set by the user, minimum is 1024*64 bytes which can go upto 4mb = 4,000,000 bytes
         * @param prizeFeeds - prize description and feeds published....? todo: prizeFeeds object generation
         * @param private_key - private key of the user to broadcast the transaction
         * @param callback
         * @returns {object}
         */

    }, {
        key: 'updateWitness',
        value: function updateWitness(account_name, url, block_signing_key, accountCreationFee, maximumBlockSizeLimit, prizeFeeds, private_key, callback) {
            var _this11 = this;

            var props = {
                account_creation_fee: accountCreationFee,
                maximum_block_size: maximumBlockSizeLimit,
                price_feeds: prizeFeeds
            };
            return this.call('update_witness', [account_name, url, block_signing_key, props], function (err, response) {
                if (err) callback(err, '');else {
                    _this11.startBroadcasting(response, private_key, callback);
                }
            });
        }

        /**
         * Get account history depending on the search type
         * @param accountName - name of the the account
         * @param type - type of operation
         * @param from - starting point of the search
         * @param limit - number of data to be searched
         * @param callback - callback function
         * @return {Object}
         */

    }, {
        key: 'getAccountHistoryByType',
        value: function getAccountHistoryByType(accountName, type, from, limit, callback) {
            return this.call('get_account_history', [accountName, from, limit], function (err, response) {
                if (err) callback(err, '');else {
                    response.forEach(function (r) {
                        var operationName = r[r.length - 1].op[r.length - 2];
                        if (operationName === type) {
                            callback('', r[r.length - 1]);
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

    return Sophia;
}(_events2.default);

// Export singleton instance


var sophia = new Sophia(_config2.default);
exports = module.exports = sophia;
exports.Sophia = Sophia;