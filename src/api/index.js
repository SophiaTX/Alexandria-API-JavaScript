import EventEmitter from 'events';
import Promise from 'bluebird';
import config from '../config';
import methods from './methods';
import transports from './transports';
import {
    camelCase
} from '../utils';
import {
    jsonRpc
} from './transports/http';

const auth = require('../auth');
class Sophia extends EventEmitter {

    constructor(options = {}) {
        super(options);
        this._setTransport(options);
        this._setLogger(options);
        this.options = options;
        this.seqNo = 0; // used for rpc calls
        methods.forEach(method => {
            const methodName = method.method_name || camelCase(method.method);
            const methodParams = method.params || [];

            this[`${methodName}With`] = (options, callback) => {
                return this.send(method.api, {
                    method: method.method,
                    params: methodParams.map(param => options[param])
                }, callback);
            };

            this[methodName] = (...args) => {
                const options = methodParams.reduce((memo, param, i) => {
                    memo[param] = args[i]; // eslint-disable-line no-param-reassign
                    return memo;
                }, {});
                const callback = args[methodParams.length];
                return this[`${methodName}With`](options, callback);
            };

	          this[`${methodName}WithAsync`] = Promise.promisify(this[`${methodName}With`]);
            this[`${methodName}Async`] = Promise.promisify(this[methodName]);
        });
        this.callAsync = Promise.promisify(this.call);
        this.signedCallAsync = Promise.promisify(this.signedCall);
    }

    _setTransport(options) {
        if (options.url && options.url.match('^((http|https)?:\/\/)')) {
            options.uri = options.url;
            options.transport = 'http';
            this._transportType = options.transport;
            this.options = options;
            this.transport = new transports.http(options);
        } else if (options.url && options.url.match('^((ws|wss)?:\/\/)')) {
            options.websocket = options.url;
            options.transport = 'ws';
            this._transportType = options.transport;
            this.options = options;
            this.transport = new transports.ws(options);
        } else if (options.transport) {
            if (this.transport && this._transportType !== options.transport) {
                this.transport.stop();
            }
            this._transportType = options.transport;

            if (typeof options.transport === 'string') {
                if (!transports[options.transport]) {
                    throw new TypeError(
                        'Invalid `transport`, valid values are `http`, `ws` or a class',
                    );
                }
                this.transport = new transports[options.transport](options);
            } else {
                this.transport = new options.transport(options);
            }
        } else {
            this.transport = new transports.ws(options);
        }
    }

    _setLogger(options) {
        if (options.hasOwnProperty('logger')) {
            switch (typeof options.logger) {
                case 'function':
                    this.__logger = {
                        log: options.logger
                    };
                    break;
                case 'object':
                    if (typeof options.logger.log !== 'function') {
                        throw new Error('setOptions({logger:{}}) must have a property .log of type function')
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

    log(logLevel) {
        if (this.__logger) {
            if ((arguments.length > 1) && typeof this.__logger[logLevel] === 'function') {
                let args = Array.prototype.slice.call(arguments, 1);
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

    send(api, data, callback) {
        var cb = callback;
        if (this.__logger) {
            let id = Math.random();
            let self = this;
            this.log('xmit:' + id + ':', data)
            cb = function(e, d) {
                if (e) {
                    self.log('error', 'rsp:' + id + ':\n\n', e, d)
                } else {
                    self.log('rsp:' + id + ':', d)
                }
                if (callback) {
                    callback.apply(self, arguments)
                }
            }
        }
        return this.transport.send(api, data, cb);
    }

    /**
     * @param method -  method name
     * @param params - arguments
     * @param callback - callback function
     * @returns {object}
     */
    call(method, params, callback) {
        try {
            if (this._transportType !== 'http') {
                callback(new Error('RPC methods can only be called when using http transport'));
                return
            }
            const id = ++this.seqNo;

            jsonRpc(this.options.uri, {method, params, id})
                .then(res => {
                    callback(null, res)
                }, err => {
                    callback(err,null)
                });
        }
        catch(e){
            callback(e,null);
        }
    }

    signedCall(method, params, account, key, callback) {
        if (this._transportType !== 'http') {
            callback(new Error('RPC methods can only be called when using http transport'));
            return;
        }
        const id = ++this.seqNo;
        let request;
        try {
            request = signRequest({method, params, id}, account, [key]);
        } catch (error) {
            callback(error);
            return;
        }
        jsonRpc(this.options.uri, request)
            .then(res => { callback(null, res) }, err => { callback(err) });
    }

    setOptions(options) {
        Object.assign(this.options, options);
        this._setLogger(options);
        this._setTransport(options);
        this.transport.setOptions(options);
    }

    setWebSocket(url) {
        this.setOptions({
            websocket: url
        });
    }

    setUri(url) {
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

    startBroadcasting(operation,private_key,callback) {
        let sign;
        let transaction;
        try {
            return this.call('calculate_fee',[operation,'SPHTX'],(err,response)=>{
                        if (err)
                            callback(err, null);
                        else {
                                this.call('add_fee',[operation,response],(err,response)=>{
                                    if(err){
                                        callback(err, null);
                                    }
                                    else{
                                        this.call('create_simple_transaction',[response],(err,response)=> {
                                            if (err)
                                                callback(err, null);
                                            else {
                                                transaction=response;
                                                this.call('get_transaction_digest', [transaction], (err, response) => {
                                                    if (err)
                                                        callback(err, null);
                                                    else {
                                                        sign=auth.createSignature(response, private_key);
                                                        this.call('add_signature', [transaction, sign], (err, response) => {
                                                                     if (err)
                                                                         callback(err, null);
                                                                     else {
                                                                         this.call('broadcast_transaction', [response], (err, response) => {
                                                                             if (err) {
                                                                                 callback(err, null);
                                                                             }
                                                                             else {
                                                                                 callback(null, response);
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
        catch(ex){
         callback(err,null);
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
    createAccount(creator,seed,private_key,json_meta, owner, active, memo_key,callback){
        return this.call('create_account',[creator,seed, json_meta, owner, active, memo_key],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                this.startBroadcasting(response,private_key,callback);
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
    updateAccount(account_name,json_meta,owner,active, memo_key,private_key,callback){
        return this.call('update_account',[account_name, json_meta, owner, active, memo_key],(err,response)=>{
            if(err)
                callback(err,null);
            else {
                 this.startBroadcasting(response,private_key,callback)
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
    deleteAccount(account_name,private_key,callback){
        return this.call('delete_account',[account_name],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                 this.startBroadcasting(response,private_key,callback)
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
    transfer(from, to, amount, memo,private_key,callback){
        return this.call('transfer',[from, to, amount, memo],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                this.startBroadcasting(response,private_key,callback)
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
    transferToVesting(from, to, amount,private_key,callback){
        return this.call('transfer_to_vesting',[from, to, amount],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                this.startBroadcasting(response,private_key,callback);
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
    setVotingProxy(account_to_modify,proxy,private_key,callback){
        return this.call('set_voting_proxy',[account_to_modify, proxy],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                 this.startBroadcasting(response,private_key,callback)

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
    voteForWitness(accountToVoteWith, witness_to_vote_for, approve=true,private_key,callback){
        return this.call('vote_for_witness',[accountToVoteWith, witness_to_vote_for, approve],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                this.startBroadcasting(response,private_key,callback);
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
    withdrawVesting(from,vesting_shares,private_key,callback){
        return this.call('withdraw_vesting',[from,vesting_shares],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                this.startBroadcasting(response,private_key,callback);
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
    updateWitness(account_name, url, block_signing_key, accountCreationFee,maximumBlockSizeLimit,prizeFeeds,private_key,callback){

        let props={
            account_creation_fee:accountCreationFee,
            maximum_block_size:maximumBlockSizeLimit,
            price_feeds:prizeFeeds,
        };
        return this.call('update_witness',[account_name, url, block_signing_key, props],(err,response)=>{
            if(err)
                callback(err,'');
            else {
                 this.startBroadcasting(response,private_key,callback)
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
    getAccountHistoryByType(accountName,type,from, limit,callback) {
        return this.call('get_account_history', [accountName, from, limit], (err, response) => {
            if (err)
                callback(err, '');
            else {
                response.forEach(r=>{
                    let operationName=r[r.length-1].op[r.length-2];
                    if(operationName===type){
                        callback('',r[r.length-1]);
                    }

                });
            }
        });
    }

    /**
     * get Account transfer history
     * @param accountName - name of the the account
     * @param from - starting point of the search
     * @param limit - number of data to be searched
     * @param callback - callback function
     * @return {Object}
     */
    getAccountTransferHistory(accountName,from, limit,callback) {
        return this.call('get_account_history', [accountName, from, limit], (err, response) => {
            if (err)
                callback(err, '');
            else {
                response.forEach(r=>{
                    let operationName=r[r.length-1].op[r.length-2];

                    if(operationName==='transfer'){
                        let result='{"block": '+r[r.length-1].block+',' +
                            '                          "fee_payer": "'+r[r.length-1].fee_payer+'",' +
                            '                         "op": {' +
                            '                           "amount": "'+r[r.length-1].op[r.length-1].amount+'",' +
                            '                            "fee": "'+r[r.length-1].op[r.length-1].fee+'", ' +
                            '                            "from": "'+r[r.length-1].op[r.length-1].from+'",' +
                            '                          "memo": "'+r[r.length-1].op[r.length-1].memo+'",' +
                            '                          "to": "'+r[r.length-1].op[r.length-1].to+'",' +
                            '                         "type": "'+operationName+'"' +
                            '                          },' +
                            '                     "op_in_trx": '+r[r.length-1].op_in_trx+',' +
                            '                    "timestamp": "'+r[r.length-1].timestamp+'",' +
                            '                         "trx_id": "'+r[r.length-1].trx_id+'",' +
                            '                          "trx_in_block": '+r[r.length-1].trx_in_block+',' +
                            '                         "virtual_op": '+r[r.length-1].virtual_op+'}';
                        let objectResult=JSON.parse(result);
                        callback('',objectResult);
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



}


// Export singleton instance
const sophia= new Sophia(config);
exports = module.exports = sophia;
exports.Sophia = Sophia;
