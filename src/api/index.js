import EventEmitter from 'events';
import config from '../config';
import transports from './transports';
import {jsonRpc} from './transports/http';
import gelf from '../logging';
const auth = require('../auth');
class Sophia extends EventEmitter {

    constructor(options = {}) {
        super(options);
        this.options = options;
        this.seqNo = 0; // used for rpc calls

    }

    logError(err){
        let message=gelf.ErrorMessage(err, this.options.uri);
        gelf.emit('gelf.log',message,(err)=>{
            if(err)
                console.log(err);
        });
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
        gelf.setHost(options.logUri);
        console.log('in logger options');
        // if (options.hasOwnProperty('logger')) {
        //     console.log('Yes');
        //     switch (typeof options.logger) {
        //         case 'function':
        //             this.__logger = {
        //                 log: options.logger
        //             };
        //             break;
        //         case 'object':
        //             if (typeof options.logger.log !== 'function') {
        //                 throw new Error('setOptions({logger:{}}) must have a property .log of type function');
        //             }
        //             this.__logger = options.logger;
        //             break;
        //         case 'undefined':
        //             if (this.__logger) break;
        //         default:
        //             this.__logger = false;
        //     }
        // }
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

                //gelf.emitError(new Error('RPC methods can only be called when using http transport'));
                callback(new Error('RPC methods can only be called when using http transport'));

                return;
            }
            const id = ++this.seqNo;

            jsonRpc(this.options.uri, {method, params, id})
                .then(res => {
                    if(res.hasOwnProperty('Error')){
                        this.logError(err);
                    }
                    callback(null, res);
                }, err => {
                    this.logError(err);
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

            jsonRpc('http://devnet.sophiatx.com:9193', {method, params, id})
                .then(res => {
                    callback(null, res);
                }, err => {
                    this.logError(err);
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
        let chainId;
        let transaction;
        let createtransaction;
        let signedTransaction;
        try {
            return this.call('calculate_fee', [operation, 'SPHTX'], (err, response) => {
                if (err)
                    callback(err, '');
                else {
                    this.call('add_fee', [operation, response], (err, response) => {
                        if (err)
                            this.logError(e);
                        else {
                            transaction=response;
                            this.call('about', [operation, response], (err, response) => {
                                if (err)
                                    callback(err, '');
                                else {
                                    chainId = response.chain_id;
                                    this.call('create_simple_transaction', [transaction], (err, response) => {
                                        if (err)
                                            callback(err, '');
                                        else {
                                            createtransaction = response;
                                            var digest = auth.CreateDigest(createtransaction, chainId);
                                            try{
                                                signedTransaction=auth.signTransaction(createtransaction, privateKey, digest);
                                            }
                                            catch(e){
                                                this.logError(e);
                                                callback(e,'');
                                            }
                                                    this.call('broadcast_transaction', [signedTransaction], (err, response) => {
                                                        if (err) {
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

    return sophia.call('create_account', [creator, seed, jsonMeta, owner, active, memoKey], function (err, response) {
        if (err)
        {
            callback(err, '');
        }
        else {
            sophia.startBroadcasting(response, privateKey, callback);
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
    return sophia.call('update_account',[accountName, jsonMeta, owner, active, memoKey],(err,response)=>{
        if(err)
            callback(err,null);
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('delete_account',[accountName],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('transfer',[from, to, amount, memo],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('transfer_to_vesting',[from, to, amount],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('set_voting_proxy',[accountToModify, proxy],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,private_key,callback);
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
    return sophia.call('vote_for_witness',[accountToVoteWith, accountToVoteFor, approve],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,private_key,callback);
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
    return sophia.call('withdraw_vesting',[from,vestingShares],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('update_witness',[accountName, url, blockSigningKey, props],(err,response)=>{
        if(err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,private_key,callback);
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
    return sophia.call('get_account_history', [accountName, from, limit], (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.length > 0) {
                response.forEach(r => {
                    let operationName = r[r.length - 1].op[r.length - 2];
                    //console.log(operationName);
                    if (operationName === type) {
                        callback('', r[r.length - 1]);
                    }
                });
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
sophia.getAccountTransferHistory=function(accountName,from, limit,callback) {
    return sophia.call('get_account_history', [accountName, from, limit], (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.length > 0) {
                response.forEach(r => {
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
    return sophia.call('get_account_history', [accountName, from, limit], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * About block chain
 * @param callback
 * @return {Object}
 */
sophia.about=function(callback) {
    return sophia.call('about', [], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * information about the current updates on the block chain
 * @param callback
 * @return {Object}
 */
sophia.info=function(callback) {
    return sophia.call('info', [], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
        }
    });
};
/**
 * help for methods supported by the block chain
 * @param callback
 * @return {Object}
 */
sophia.help=function(callback) {
    return sophia.call('help',[], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_witness', [nameOfTheWitness], (err, response) => {
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
    return sophia.call('list_witnesses', [name,limit], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('list_witnesses_by_vote', [name,limit], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_block', [blockNum], (err, response) => {
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
    return sophia.call('get_ops_in_block', [blockNum,onlyVirtual], (err, response) => {
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
    return sophia.call('get_feed_history', [symbol], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_account', [name], (err, response) => {
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
    return sophia.call('get_transaction', [trxId], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_account_name_from_seed', [seed], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('account_exist', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_active_authority', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_owner_authority', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_memo_key', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_account_balance', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('get_vesting_balance', [accountName], (err, response) => {
        if (err)
            callback(err, '');
        else {
            callback('', response);
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
    return sophia.call('sponsor_account_fees', [sponsoring_account, sponsored_account, is_sponsoring], (err, response) => {
        if (err)
            callback(err, '');
        else {
            //callback('', response);
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('get_received_documents', [appId, accountName, searchType, start, count], (err, response) => {
        if (err)
            callback(err, '');
        else {
            if (response.length > 0) {
                response.forEach(r => {
                    let simplifieddata=JSON.stringify(r[r.length - 1].data);
                        let result = '{"app_id": ' + r[r.length - 1].app_id + ',' +
                            '                          "binary": "' + r[r.length - 1].binary + '",' +
                            '                         "recipients": "' +r[r.length - 1].recipients+ '",' +
                            '                     "sender": "' + r[r.length - 1].sender + '",' +
                            '                     "data": ' + simplifieddata + ',' +
                            '                    "received": "' + r[r.length - 1].received + '"}';
                        let objectResult = JSON.parse(result);
                        callback('', objectResult);

                });
            }else{
                callback('',response);
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
    return sophia.call('make_custom_json_operation', [appId, from, to, data], (err, response) => {
        if (err)
            callback(err, '');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
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
    return sophia.call('make_custom_binary_operation', [appId, from, to, data], (err, response) => {
        if (err)
            callback(err,'');
        else {
            sophia.startBroadcasting(response,privateKey,callback);
        }
    });
};


module.exports = sophia;
exports.Sophia = Sophia;
