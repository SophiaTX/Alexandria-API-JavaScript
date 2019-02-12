import EventEmitter from 'events';

import config from '../config';
import transports from './transports';
import {
    jsonRpc
} from './transports/http';
import * as KeyPrivate from "../auth/ecc/src/key_private";
const operations = require('../auth/serializer/src/operations');
const ecc=require('../auth/ecc');
const auth=require('../auth');
const assert = require('assert');

class Sophia extends EventEmitter {

    constructor(options = {}) {
        super(options);
        //this._setTransport(options);
        //this._setLogger(options);
        this.options = options;
        this.seqNo = 0; // used for rpc calls


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
                        'Invalid `transport`, valid values are `http`, `ws` or a class'
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
        //console.log('in logger options');
        if (options.hasOwnProperty('logger')) {
            console.log('Yes');
            switch (typeof options.logger) {
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
        let cb = callback;
        if (this.__logger) {
            let id = Math.random();
            let self = this;
            this.log('xmit:' + id + ':', data);
            cb = function (e, d) {
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
    call(method, params, callback) {
        try {
            if (this._transportType !== 'http') {

                //logger.log('RPC methods can only be called when using http transport');
                callback(new Error('RPC methods can only be called when using http transport'));

                return;
            }
            const id = ++this.seqNo;

            jsonRpc(this.options.uri, {method, params, id})
                .then(res => {
                    callback(null, res);
                }, err => {
                    callback(err, null);
                });
        }
        catch (e) {
            callback(e, null);
        }
    }
    /**
     * @param method -  method name
     * @param params - arguments
     * @param callback - callback function
     * @returns {object}
     */
    callDaemon(method, params, callback) {
        try {
            if (this._transportType !== 'http') {

                //logger.log('RPC methods can only be called when using http transport');
                callback(new Error('RPC methods can only be called when using http transport'));

                return;
            }
            const id = ++this.seqNo;

            jsonRpc('http://stagenet.sophiatx.com:9193', {method, params, id})
                .then(res => {
                    callback(null, res);
                }, err => {
                    callback(err, null);
                });
        }
        catch (e) {
            callback(e, null);
        }
    }
    // signedCall(method, params, account, key, callback) {
    //     if (this._transportType !== 'http') {
    //         callback(new Error('RPC methods can only be called when using http transport'));
    //         return;
    //     }
    //     const id = ++this.seqNo;
    //     let request;
    //     try {
    //         request = signRequest({method, params, id}, account, [key]);
    //     } catch (error) {
    //         callback(error);
    //         return;
    //     }
    //     jsonRpc(this.options.uri, request)
    //         .then(res => { callback(null, res); }, err => { callback(err); });
    // }

    // setOptions(options) {
    //     Object.assign(this.options, options);
    //     this._setLogger(options);
    //     this._setTransport(options);
    //     this.transport.setOptions(options);
    // }

    // setWebSocket(url) {
    //     this.setOptions({
    //         websocket: url
    //     });
    // }
    //
    // setUri(url) {
    //     this.setOptions({
    //         uri: url
    //     });
    // }
    /**
     * Broadcast transactions over the blockchain using users private key
     * @param operation - transaction generated by the operations
     * @param privateKey - private key of the users account
     * @param callback
     * @returns {object}
     */

    startBroadcasting(operation, privateKey, callback) {
        let signedTransaction;
        let createtransaction;
        try {
            return this.call('alexandria_api.create_simple_transaction', {op:operation}, (err, response) => {
                if (err)
                    callback(err, '');
                else {
                    createtransaction = response.simple_tx;
                    // this.call('get_transaction_digest', [createtransaction], (err, response) => {
                    //     if (err) {
                    //
                    //         callback(err, '');
                    //     }
                    //     else {
                    //
                    //         console.log(response);
                    //     }
                    // });
                    try {
                        //console.log(config.get('chainId'));
                        var digest = auth.CreateDigest(createtransaction, config.get('chainId'));
                        //console.log(digest);
                        signedTransaction = auth.signTransaction(createtransaction, privateKey, digest);
                    }
                    catch (e) {
                        callback(e, '');
                    }
                    this.call('alexandria_api.broadcast_transaction', {tx:signedTransaction}, (err, response) => {
                        if (err) {
                            // logger.log(err);
                            callback(err, '');
                        }
                        else {
                            callback('', response.tx);
                        }
                    });
                }
            });
        }
        catch (ex) {
            callback(ex, null);
        }
    }
    /**
     * broadcast transaction with manual addFees
     */

    startBroadcastingDaemonMethods(operation, privateKey, callback){
        let signedTransaction;
        let chainId;
        let transaction;
        let createtransaction;
        try {
            return this.call('alexandria_api.calculate_fee', [operation, 'SPHTX'], (err, response) => {
                if (err)
                    callback(err, '');
                else {
                    this.call('alexandria_api.add_fee', [operation, response], (err, response) => {
                        if (err)
                            callback(err, '');
                        else {
                            transaction = response;
                            this.call('alexandria_api.about', [operation, response], (err, response) => {
                                if (err)
                                    callback(err, '');
                                else {
                                    chainId = response.chain_id;
                                    this.call('alexandria_api.create_simple_transaction', [transaction], (err, response) => {
                                        if (err)
                                            callback(err, '');
                                        else {
                                            createtransaction = response;
                                            // this.call('get_transaction_digest', [createtransaction], (err, response) => {
                                            //     if (err) {
                                            //
                                            //         callback(err, '');
                                            //     }
                                            //     else {
                                            //
                                            //         console.log(response);
                                            //
                                            //     }});

                                            try {
                                                var digest = auth.CreateDigest(createtransaction, chainId);
                                                //console.log(digest);
                                                signedTransaction = auth.signTransaction(createtransaction, privateKey, digest);

                                            }
                                            catch (e) {
                                                callback(e, '');
                                            }
                                            this.call('alexandria_api.broadcast_transaction', {signedTransaction}, (err, response) => {
                                                if (err) {
                                                    // logger.log(err);
                                                    callback(err, '');
                                                }
                                                else {
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
        catch (ex) {
            callback(ex, null);
        }

    }
}



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
let sophia = new Sophia(config);

sophia.setOptions=function(options) {
    Object.assign(sophia.options, options);
    sophia._setLogger(options);
    sophia._setTransport(options);
    sophia.transport.setOptions(options);
    sophia.about(function(err, response){
        config.set('chainId',response.chain_id);
    });
};
/**
 * Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
 * @param creator - sponsor account with enough balance for creating an account
 * @param seed - account name (easy to remember)
 * @param privateKey - Creator's private key
 * @param jsonMeta - json data (details about the account)
 * @param owner - Owner Key
 * @param active - Active Key
 * @param memoKey - Memo Key
 * @param callback
 * @returns {object}
 */
sophia.createAccount= function(creator, seed, privateKey, jsonMeta, owner, active, memoKey, callback) {

    return sophia.call('alexandria_api.create_account', {creator:creator, name_seed:seed, json_meta:jsonMeta, owner:owner, active:active, memo:memoKey}, function (err, response) {
        if (err)
        {
            //logger.log(err);
            callback(err, '');
        }
        else {

            sophia.startBroadcasting(response.op, privateKey, callback);
        }
    });
};
/**
 * Update ActiveKey, OwnerKey, MemoKey and JsonMetadata of the account using user's PrivateKey
 * @param accountName - account name (hash / System generated)
 * @param privateKey - user's private key
 * @param jsonMeta - json data (details about the account)
 * @param owner - Owner Key
 * @param active - Active Key
 * @param memoKey - Memo Key
 * @param callback
 * @returns {object}
 */
sophia.updateAccount=function(accountName,jsonMeta,owner,active, memoKey,privateKey,callback){
    return sophia.call('alexandria_api.update_account',{account_name:accountName, json_meta:jsonMeta, owner:owner, active:active, memo:memoKey},(err,response)=>{
        if(err)
            callback(err,null);
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * Delete account using user's PrivateKey
 * @param accountName - name of the account to be deleted
 * @param privateKey - user's private key
 * @param callback
 * @returns {object}
 */
sophia.deleteAccount=function(accountName,privateKey,callback){
    return sophia.call('alexandria_api.delete_account',{account_name:accountName},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * Transfer an amount (in the form of "amount (space) currencySymbol i.e 10.000 SPHTX") to other account with a memo (receipt/details) attached to the transfer using Sender's Priavtekey.
 * @param from - account name of sender
 * @param to - account name of receiver
 * @param amount - amount to be transferred
 * @param memo - encrypted memo to be transferred along with the amount
 * @param privateKey - private key of the user
 * @param callback
 * @returns {object}
 */
sophia.transfer=function(from, to, amount, memo,privateKey,callback){
    return sophia.call('alexandria_api.transfer',{from:from, to:to, amount:amount, memo:memo},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * Transfer amount (in the form of "amount currencySymbol, 10.000 SPHTX") to Vesting.
 * @param from - sender's account name
 * @param to - receiver's account name
 * @param amount - amount to be transferred
 * @param privateKey - sender's private key
 * @param callback
 * @returns {object}
 */
sophia.transferToVesting=function(from, to, amount,privateKey,callback){
    return sophia.call('alexandria_api.transfer_to_vesting',{from:from, to:to, amount:amount},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * Set a proxy account for doing votes on behalf of first account.
 * @param accountToModify - main account name
 * @param proxy - proxy account name
 * @param private_key - private key of the main account
 * @param callback
 * @returns {object}
 */
sophia.setVotingProxy=function(accountToModify,proxy,private_key,callback){
    return sophia.call('alexandria_api.set_voting_proxy',{account_to_modify:accountToModify, proxy:proxy},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,private_key,callback);
        }
    });
};
/**
 * Vote for a witness using witness name and voter's PrivateKey
 * @param accountToVoteWith - account name of the account to vote from
 * @param accountToVoteFor - account name of the account to vote for
 * @param approve - True for positive vote and false for negative vote to the witness
 * @param private_key - private key of the user
 * @param callback
 * @returns {object}
 */
sophia.voteForWitness=function(accountToVoteWith, accountToVoteFor, approve=true,private_key,callback){
    return sophia.call('alexandria_api.vote_for_witness',{voting_account:accountToVoteWith, witness_to_vote_for:accountToVoteFor, approve:approve},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,private_key,callback);
        }
    });
};
/**
 * Withdraw amount (in the form of "amount currencySymbol, 10.000 SPHTX") from Vesting in fractions.
 * @param from - users account name
 * @param vestingShares - amount to be be withdrawn from vesting account
 * @param privateKey - user's private key
 * @param callback
 * @returns {object}
 */
sophia.withdrawVesting=function(from,vestingShares,privateKey,callback){
    return sophia.call('alexandria_api.withdraw_vesting',{from:from,vesting_shares:vestingShares},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};


/**
 * Update witness account with maximum block size greater than minimum block size of 1024*64 and array of Prize feeds
 * @param accountName - account name of the user wishes to be witness
 * @param url - url of the description published online about the user
 * @param blockSigningKey - users public key for signing the blocks
 * @param accountCreationFee - account creation fees
 * @param maximumBlockSizeLimit - maximum block size limit set by the user, minimum is 1024*64 bytes which can go upto 4mb = 4,000,000 bytes
 * @param prizeFeeds - prize description and feeds published
 * @param private_key - private key of the user to broadcast the transaction
 * @param callback
 * @returns {object}
 */
sophia.updateWitness=function(accountName, url, blockSigningKey, accountCreationFee,maximumBlockSizeLimit,prizeFeeds,private_key,callback){
    let props={
        account_creation_fee:accountCreationFee,
        maximum_block_size:maximumBlockSizeLimit,
        price_feeds:prizeFeeds,
    };
    return sophia.call('alexandria_api.update_witness',{witness_account_name:accountName, url:url, block_signing_key:blockSigningKey, pros:props},(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,private_key,callback);
        }
    });
};

/**
 * Get account history depending on the search type
 * @param accountName - name of the the account
 * @param type - type of operation
 * @param from - starting point of the search
 * @param limit - number of data to be searched
 * @param callback - callback function
 * @return {Object}
 */
sophia.getAccountHistoryByType=function(accountName,type,from, limit,callback) {
    return sophia.call('alexandria_api.get_account_history', {account:accountName, start:from, limit:limit}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.account_history.length > 0) {
                let valueArray=[];
                response.account_history.forEach(r => {
                    let operationName = r[r.length - 1].op[r.length - 2];
                    if (operationName === type) {

                        valueArray.push(r[r.length - 1]);

                    }

                });
                callback('', valueArray);
            }else{
                callback('',response);
            }
        }
    });
};
/**
 * get Account transfer history
 * @param accountName - name of the the account
 * @param from - starting point of the search
 * @param limit - number of data to be searched
 * @param callback - callback function
 * @return {Object}
 */
sophia.getAccountTransferHistory=function(accountName, from, limit, callback) {
    return sophia.call('alexandria_api.get_account_history', {account:accountName, start:from, limit:limit}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.account_history.length > 0) {
                response.account_history.forEach(r => {
                    let operationName = r[r.length - 1].op[r.length - 2];

                    if (operationName === 'transfer') {
                        let result = '{"block": ' + r[r.length - 1].block + ',' +
                            '                          "fee_payer": "' + r[r.length - 1].fee_payer + '",' +
                            '                         "op": {' +
                            '                           "amount": "' + r[r.length - 1].op[r.length - 1].amount + '",' +
                            '                            "fee": "' + r[r.length - 1].op[r.length - 1].fee + '", ' +
                            '                            "from": "' + r[r.length - 1].op[r.length - 1].from + '",' +
                            '                          "memo": "' + r[r.length - 1].op[r.length - 1].memo + '",' +
                            '                          "to": "' + r[r.length - 1].op[r.length - 1].to + '",' +
                            '                         "type": "' + operationName + '"' +
                            '                          },' +
                            '                     "op_in_trx": ' + r[r.length - 1].op_in_trx + ',' +
                            '                    "timestamp": "' + r[r.length - 1].timestamp + '",' +
                            '                         "trx_id": "' + r[r.length - 1].trx_id + '",' +
                            '                          "trx_in_block": ' + r[r.length - 1].trx_in_block + ',' +
                            '                         "virtual_op": ' + r[r.length - 1].virtual_op + '}';
                        let objectResult = JSON.parse(result);
                        callback('', objectResult);
                    }

                });
            }else{
            callback('',response);
        }
        }
    });
};
/**
 * Get Account History
 * @param accountName
 * @param from
 * @param limit
 * @param callback
 * @return {Object}
 */
sophia.getAccountHistory=function(accountName,from, limit,callback) {
    return sophia.call('alexandria_api.get_account_history', {account:accountName, start:from, limit:limit}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.account_history);
        }
    });
};
/**
 * About block chain
 * @param callback
 * @return {Object}
 */
sophia.about=function(callback) {
    return sophia.call('alexandria_api.about', {}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.about);
        }
    });
};
/**
 * information about the current updates on the block chain
 * @param callback
 * @return {Object}
 */
sophia.info=function(callback) {
    return sophia.call('alexandria_api.info', {}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.info);
        }
    });
};
/**
 * help for methods supported by the block chain
 * @param callback
 * @return {Object}
 */
sophia.help=function(callback) {
    return sophia.call('alexandria_api.help',{}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.help);
        }
    });
};
/**
 * Get details about a witness
 * @param nameOfTheWitness
 * @param callback
 * @return {Object}
 */
sophia.getWitness=function(nameOfTheWitness,callback) {
    return sophia.call('alexandria_api.get_witness', {owner_account:nameOfTheWitness}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * Get list of witnesses
 * @param name
 * @param limit
 * @param callback
 * @return {Object}
 */
sophia.listWitnesses=function(name,limit,callback) {
    return sophia.call('alexandria_api.list_witnesses', {start:name,limit:limit}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.witnesses);
        }
    });
};
/**
 * List of all witnesses depending on the number of votes received by each witnesses
 * @param name
 * @param limit
 * @param callback
 * @return {Object}
 */
sophia.listWitnessesByVote=function(name,limit,callback) {
    return sophia.call('alexandria_api.list_witnesses_by_vote', {name:name,limit:limit}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.witnesses_by_vote);
        }
    });
};
/**
 * Get a block and info about ir
 * @param blockNum
 * @param callback
 * @return {Object}
 */
sophia.getBlock=function(blockNum,callback) {
    return sophia.call('alexandria_api.get_block', {num:blockNum}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * Get operations from a block
 * @param blockNum
 * @param onlyVirtual
 * @param callback
 * @return {Object}
 */
sophia.getOpsInBlock=function(blockNum,onlyVirtual,callback) {
    return sophia.call('alexandria_api.get_ops_in_block', {block_num:blockNum,only_virtual:onlyVirtual}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * Get all feed history
 * @param symbol
 * @param callback
 * @return {Object}
 */
sophia.getFeedHistory=function(symbol,callback) {
    return sophia.call('alexandria_api.get_feed_history', {symbol:symbol}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.feed_history);
        }
    });
};
/**
 * Get account details
 * @param name
 * @param callback
 * @return {Object}
 */
sophia.getAccount=function(name,callback) {
    return sophia.call('alexandria_api.get_account', {account_name:name}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * Get transaction details
 * @param trxId
 * @param callback
 * @return {Object}
 */
sophia.getTransaction=function(trxId,callback) {
    return sophia.call('alexandria_api.get_transaction', {tx_id:trxId}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.tx);
        }
    });
};
/**
 *Get account name from seed
 * @param seed
 * @param callback
 * @return {Object}
 */
sophia.getAccountNameFromSeed=function(seed,callback) {
    return sophia.call('alexandria_api.get_account_name_from_seed', {seed:seed}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.account_name);
        }
    });
};
/**
 * Check if the account exists or not
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.accountExist=function(accountName,callback) {
    return sophia.call('alexandria_api.account_exist', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.account_exists);
        }
    });
};
/**
 * call random functions from daemon
 * @param pluginName
 * @param methodName
 * @param args
 * @param callback
 * @return {Object}
 */
sophia.callPlugin=function(pluginName,methodName,args,callback) {
    return sophia.callDaemon(pluginName+'.'+methodName, args, (err, response) => {

        if (err)
            callback(err, '');
        else {
            callback('', response);
        }

    });
};
/**
 * Get account active authority key
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.getActiveAuthority=function(accountName,callback) {
    return sophia.call('alexandria_api.get_active_authority', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.active_authority);
        }
    });
};
/**
 * Get accounts Owner authority key
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.getOwnerAuthority=function(accountName,callback) {
    return sophia.call('alexandria_api.get_owner_authority', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.owner_authority);
        }
    });
};
/**
 * Get account memo key
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.getMemoKey=function(accountName,callback) {
    return sophia.call('alexandria_api.get_memo_key', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.memo_key);
        }
    });
};
/**
 * Get account balance
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.getAccountBalance=function(accountName,callback) {
    return sophia.call('alexandria_api.get_account_balance', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.account);
        }
    });
};
/**
 * Get account vesting balance
 * @param accountName
 * @param callback
 * @return {Object}
 */
sophia.getVestingBalance=function(accountName,callback) {
    return sophia.call('alexandria_api.get_vesting_balance', {account_name:accountName}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response.vesting_balance);
        }
    });
};
/**
 * Sponsor accounts
 * @param sponsoring_account
 * @param sponsored_account
 * @param is_sponsoring
 * @param privateKey
 * @param callback
 * @return {Object}
 */
sophia.sponsorAccountFees=function(sponsoring_account, sponsored_account, is_sponsoring, privateKey, callback) {
    return sophia.call('alexandria_api.sponsor_account_fees', {sopnsoring_account:sponsoring_account, sponsored_account:sponsored_account, is_sponsoring:is_sponsoring}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            //callback('', response);
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * List of all the documents received
 * @param appId
 * @param accountName
 * @param searchType
 * @param start
 * @param count
 * @param callback
 * @return {Object}
 */
sophia.getReceivedDocuments=function(appId, accountName, searchType, start, count, callback) {
    return sophia.call('alexandria_api.get_received_documents', {app_id:appId, account_name:accountName, search_type:searchType, start:start, count:count}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.received_documents.length > 0) {
                response.received_documents.forEach(r => {
                    let simplifieddata=JSON.stringify(r[r.length - 1].data);
                        let result = '{ "app_id":"'  + r[r.length - 1].app_id + '",' +
                            '                          "ID": "' + r[r.length - 1].id + '",' +
                            '                          "binary": "' + r[r.length - 1].binary + '",' +

                            '                         "recipients": "' +r[r.length - 1].recipients+ '",' +
                            '                     "sender": "' + r[r.length - 1].sender + '",' +
                            '                     "data": ' + simplifieddata + ',' +
                            '                    "received": "' + r[r.length - 1].received + '"}';
                        let objectResult = JSON.parse(result);
                        callback('', objectResult);
                });
            }else{
                callback('',response.received_documents);
            }
        }
    });
};
/**
 * Send Custom JSON data to list of recipients
 * @param appId
 * @param from
 * @param to
 * @param data
 * @param privateKey
 * @param callback
 * @return {Object}
 */
sophia.makeCustomJSONOperation=function( appId, from, to, data, privateKey, callback) {
    return sophia.call('alexandria_api.make_custom_json_operation', {app_id:appId, from:from, to:to, json:data}, (err, response) => {
        if (err)
            callback(err, '');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};
/**
 * Send custom data (encoded or raw) to list of recipients
 * @param appId
 * @param from
 * @param to
 * @param data
 * @param privateKey
 * @param callback
 * @return {Object}
 */
sophia.makeCustomBinaryOperation=function(appId, from, to, data, privateKey, callback) {
    return sophia.call('alexandria_api.make_custom_binary_operation', {app_id:appId, from:from, to:to, data:data}, (err, response) => {
        if (err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response.op,privateKey,callback);
        }
    });
};

sophia.getTransactionId=function(transaction){
   return auth.CreateTxId(transaction);
};
//---------------------------------------------------------------multiparty encryption


const db = require("mongoose");
db.connect('mongodb://localhost:27017/mpmdbv3',{useNewUrlParser:true});
var group_operation = operations.group_operation;
var group_create_return=operations.create_group_return;
// const group_op=db.model(
//     'group_op',{
//         group_name:String,
//         operation_payloads:Array
//     });

var group_obj = operations.group_object;
const group_object=db.model(
    'group_object',{
        group_name:String,
        current_group_name:String,
        description:String,
        members:Array,
        admin:String,
        group_key:String
    });
sophia.suggestGroupName=function(description){
    var seed=Math.random().toString()+KeyPrivate.fromSeed(description);
    var data= ecc.hash.ripemd160(seed);
    return data.toString('base64');
};
sophia.createRandomKey=function(){
    return auth.toWif(KeyPrivate.fromSeed(Math.random().toString()));
};
sophia.encode_message=function(message_content, privateKey, publicKey) {
    return auth.encrypt64(privateKey, publicKey, message_content);
};
sophia.encodeAndPack=function(privateKey, publicKey, operation){
    let message_content={
        type:operation.type,
        operation_data:operation,
    };
    let encoded_message=sophia.encode_message(message_content.toString(),privateKey, publicKey);
    return encoded_message;
};
sophia.getGroup=function(groupName,callback){
    return group_object.findOne({'group_name': groupName},(err,obj) =>{
        if(err) return callback(err,'');
        else return callback('',obj);
    });

};
sophia.getGroupName=function(groupName,callback){
    return group_object.findOne({'group_name': groupName},(err,obj) =>{
        if(err) return callback(err,'');
        else return callback('',obj);
    });

};
sophia.listMyGroups=function(start,count,callback){
    return group_object.findOne({'group_name': groupName},(err,obj) =>{
        if(err) return callback(err,'');
        else return callback('',obj);
    });

};
sophia.listMyMessages=function(groupName,start,count,callback){
    return group_object.findOne({'group_name': groupName},(err,obj) =>{
        if(err) return callback(err,'');
        else return callback('',obj);
    });

};
sophia.createGroup=function(adminName, privateKey, description, members, callback){
    return sophia.call('alexandria_api.get_account', {account_name:adminName}, (err, res) => {
        if(err)
            return callback(err);
        else {
            let admin = res.account[0];
            let group_name = sophia.suggestGroupName(description);
            let admin_name = admin.name;
            let groupKey = sophia.createRandomKey();
            let pk = admin.memo_key;
            let membersArray = members;
            let operation_payloads = [];
            for (let i=0;i<membersArray.length;i++){
            sophia.call('alexandria_api.get_account', {account_name: membersArray[i]}, (err, response) => {
                if (err) return callback(err);
                else {
                    let groupOperationInstance = {
                        version: 1,
                        type: "add",
                        description: description,
                        new_group_name: group_name,
                        user_list: membersArray,
                        senders_pubkey: pk,
                        new_key: [[response.account[0].memo_key, groupKey]]
                    };
                    let groupObjectInstance = {
                        group_name:group_name,
                        current_group_name:group_name,
                        description: description,
                        members:membersArray,
                        admin:admin_name,
                        group_key:groupKey,
                    };
                    let data = sophia.encodeAndPack(privateKey, response.account[0].memo_key, group_operation.toObject(groupOperationInstance));
                    let group_meta = {
                        sender: pk,
                        recipient: response.account[0].memo_key,
                        data: data
                    };
                    operation_payloads.push([membersArray[i], group_meta]);
                    if(i===membersArray.length-1) {
                        let ret = {
                            group_name: group_name,
                            operation_payloads: operation_payloads
                        };
                        let retObjects=group_create_return.toObject(ret);
                        console.log(retObjects);
                        let groupObjects=group_obj.toObject(groupObjectInstance);
                        let group=new group_object(groupObjects);
                        group.save().then(()=>{
                            console.log('new group created');
                        });
                    }
                }
            });
           }
         }
    });
};
sophia.addGroupParticipants=function(groupName,newMembers,admin,privateKey,callback){
   group_object.findOne({'group_name': groupName},function(err,obj) {
        if(err) return err;
        else{
            return sophia.call('alexandria_api.get_account', {account_name:obj.admin}, (err, res) => {
        if(err)
            return callback(err);
        else {
            let admin = res.account[0];
            let group_name = sophia.suggestGroupName(obj.description);
            let admin_name = admin.name;
            let newGroupKey = sophia.createRandomKey();
            let pk = admin.memo_key;
            let membersArray = obj.members;
            newMembers.forEach(function (r) {
                membersArray.push(r);
            });

            let ret=[];
            for (let i=0;i<membersArray.length;i++){

                sophia.call('alexandria_api.get_account', {account_name: membersArray[i]}, (err, response) => {
                    if (err) return callback(err);
                    else {
                        let group_object_add = {
                            version: 1,
                            type: "add",
                            description: obj.description,
                            new_group_name: group_name,
                            user_list: membersArray,
                            senders_pubkey: pk,
                            new_key: [[response.account[0].memo_key, newGroupKey]] //check for encrypted key
                        };
                        let data = sophia.encodeAndPack(privateKey, response.account[0].memo_key, group_operation.toObject(group_object_add));
                        let group_meta = {
                            sender: pk,
                            recipient: response.account[0].memo_key,
                            data: data
                        };
                        ret.push([membersArray[i], group_meta]);
                        let group_object_update = {
                            version: 1,
                            type: "update",
                            description: obj.description,
                            new_group_name: group_name,
                            user_list: membersArray,
                            senders_pubkey: pk,
                            new_key: [[response.account[0].memo_key, newGroupKey]] //check for encrypted key
                        };

                        let data_update = sophia.encodeAndPack(privateKey, response.account[0].memo_key, group_operation.toObject(group_object_update));
                        let group_meta_update = {
                            sender: pk,
                            recipient: response.account[0].memo_key,
                            data: data_update
                        };
                        if(i===membersArray.length-1) {
                            ret.push([group_name, group_meta_update]);
                            console.log(ret);
                            //let group=new group_object();
                            group_object.updateOne({'group_name':groupName},{$set:{'current_group_name':group_name,'members':membersArray,'group_key':newGroupKey}},function(err,res){

                                if(err)
                                    callback(err);
                                else {
                                    console.log('group renamed and more members added ' + newMembers);
                                    callback(res);
                                }
                            });
                        }
                    }
                });
            }
        }
    });
        }

    });
};
sophia.deleteGroupParticipants=function(groupName,deleteMembers,admin,privateKey,callback){
    group_object.findOne({'group_name': groupName},function(err,obj) {
        if(err) return err;
        else{
            return sophia.call('alexandria_api.get_account', {account_name:obj.admin}, (err, res) => {
                if(err)
                    return callback(err);
                else {
                    let admin = res.account[0];
                    let group_name = sophia.suggestGroupName(obj.description);
                    let admin_name = admin.name;
                    let newGroupKey = sophia.createRandomKey();
                    let pk = admin.memo_key;
                    let membersArray = obj.members;

                    deleteMembers.forEach(function (r) {
                        membersArray.forEach(function (l) {
                            if(l===r)
                                membersArray.splice(membersArray.indexOf(l),1);

                        });

                    });
                    console.log(membersArray);
                    let ret=[];
                    for (let i=0;i<membersArray.length;i++){

                        sophia.call('alexandria_api.get_account', {account_name: membersArray[i]}, (err, response) => {
                            if (err) return callback(err);
                            else {
                                let group_object_add = {
                                    version: 1,
                                    type: "add",
                                    description: obj.description,
                                    new_group_name: group_name,
                                    user_list: membersArray,
                                    senders_pubkey: pk,
                                    new_key: [[response.account[0].memo_key, newGroupKey]] //check for encrypted key
                                };
                                let data = sophia.encodeAndPack(privateKey, response.account[0].memo_key, group_operation.toObject(group_object_add));
                                let group_meta = {
                                    sender: pk,
                                    recipient: response.account[0].memo_key,
                                    data: data
                                };
                                ret.push([membersArray[i], group_meta]);
                                let group_object_update = {
                                    version: 1,
                                    type: "update",
                                    description: obj.description,
                                    new_group_name: group_name,
                                    user_list: membersArray,
                                    senders_pubkey: pk,
                                    new_key: [[response.account[0].memo_key, newGroupKey]] //check for encrypted key
                                };

                                let data_update = sophia.encodeAndPack(privateKey, response.account[0].memo_key, group_operation.toObject(group_object_update));
                                let group_meta_update = {
                                    sender: pk,
                                    recipient: response.account[0].memo_key,
                                    data: data_update
                                };
                                if(i===membersArray.length-1) {
                                    ret.push([group_name, group_meta_update]);
                                    console.log(ret);
                                    // let group=new group_object(ret);
                                    group_object.updateOne({'group_name':groupName},{$set:{'current_group_name':group_name,'members':membersArray,'group_key':newGroupKey}},function(err,res){
                                        if(err)
                                            callback(err);
                                        else {
                                            console.log('group renamed and some members deleted ' + deleteMembers);
                                            callback(res);
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            });
        }

    });
};
sophia.updateGroup=function(groupName,description,admin,privateKey,callback){
    group_object.findOne({'group_name': groupName},function(err,obj) {
        if(err) return err;
        else{
            return sophia.call('alexandria_api.get_account', {account_name:obj.admin}, (err, res) => {
                if (err)
                    return callback(err);
                else {
                    let admin = res.account[0];
                    let group_name = sophia.suggestGroupName(description);
                    let admin_name = admin.name;
                    let newGroupKey = sophia.createRandomKey();
                    let pk = admin.memo_key;
                    let membersArray = obj.members;

                    let ret = [];

                    let group_object_update = {
                        version: 1,
                        type: "update",
                        description: obj.description,
                        new_group_name: group_name,
                        user_list: membersArray,
                        senders_pubkey: pk,
                        new_key: [[res.account[0].memo_key, newGroupKey]] //check for encrypted key
                    };

                    let data_update = sophia.encodeAndPack(privateKey, res.account[0].memo_key, group_operation.toObject(group_object_update));
                    let group_meta_update = {
                        sender: pk,
                        recipient: res.account[0].memo_key,
                        data: data_update
                    };

                    ret.push([group_name, group_meta_update]);
                    console.log(ret);
                    group_object.updateOne({'group_name': groupName}, {
                        $set: {
                            'current_group_name': group_name,
                            'description': description
                        ,'group_key':newGroupKey
                        }
                    },
                        function (err, res) {
                        if (err)
                            callback(err);
                        else {
                            console.log('group updated ' + groupName);
                            callback(res);
                        }
                    });

                }


            });
        }

    });
};
sophia.disbandGroup = function (groupName,admin,privateKey,callback) {
    group_object.findOne({'group_name': groupName},function(err,obj) {
        if(err) return err;
        else{
            return sophia.call('alexandria_api.get_account', {account_name:obj.admin}, (err, res) => {
                if(err)
                    return callback(err);
                else {
                    let admin = res.account[0];
                    let group_name = sophia.suggestGroupName(obj.description);
                    let admin_name = admin.name;
                    let newGroupKey = sophia.createRandomKey();
                    let pk = admin.memo_key;
                    let membersArray = obj.members;

                    let ret=[];

                    let group_object_update = {
                        version: 1,
                        type: "disband",
                        description: obj.description,
                        senders_pubkey: pk,
                        new_key: [[res.account[0].memo_key, newGroupKey]] //check for encrypted key
                    };

                    let data_update = sophia.encodeAndPack(privateKey, res.account[0].memo_key, group_operation.toObject(group_object_update));
                    let group_meta_disband = {
                        sender: pk,
                        recipient: res.account[0].memo_key,
                        data: data_update
                    };

                    ret.push([group_name, group_meta_disband]);
                    console.log(ret);
                    group_object.updateOne({'group_name':groupName},{$set:{'current_group_name':group_name,'group_key':newGroupKey}},function(err,res){
                        if(err)
                            callback(err);
                        else {
                            console.log('group disbanded ' + groupName);
                            callback(res);
                        }
                    });

                }


            });
        }

    });
};
sophia.sendGroupMessages = function (groupName,sender,data,privateKey,callback) {
    group_object.findOne({'group_name': groupName},function(err,obj) {
        if(err) return err;
        else{
            return sophia.call('alexandria_api.get_account', {account_name:obj.admin}, (err, res) => {
                if(err)
                    return callback(err);
                else {
                    let admin = res.account[0];
                    let group_name = sophia.suggestGroupName(obj.description);
                    let admin_name = admin.name;
                    let newGroupKey = sophia.createRandomKey();
                    let pk = admin.memo_key;
                    let membersArray = obj.members;
                    let ret=[];
                    let messageContent={
                        message_type:1,
                        message_data:data
                    };
                    let encoded_message=sophia.encode_message(messageContent.toString(),newGroupKey, pk);
                    let group_meta_sendMessage = {
                        sender: sender,
                        recipient: res.account[0].memo_key,
                        data: encoded_message
                    };
                    ret.push([group_name, group_meta_sendMessage]);
                    console.log(ret);
                    // let group=new group_object(ret);
                    // group.save().then(()=>{
                    //     console.log('group renamed and more members added');
                    // });
                }
            });
        }
    });
};

module.exports = sophia;
exports.Sophia = Sophia;
