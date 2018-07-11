"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = [{

    "method": "about"

}, {

    "method": "info"

}, {

    "method": "help"

}, {

    "method": "get_witness",
    "params": ["nameOfThewitness"]

}, {

    "method": "list_witnesses",
    "params": ["lowerbound", "limit"]

}, {
    "method": "get_block",
    "params": ["blockNum"]
}, {
    "method": "get_ops_in_block",
    "params": ["blockNum", "onlyVirtual"]
}, {

    "method": "get_feed_history"
}, {

    "method": "get_account",
    "params": ["name"]
}, {
    "method": "get_transaction",
    "params": ["trxId"]
}, {
    "method": "create_simple_transaction",
    "params": ["tx"]
}, {

    "method": "create_account",
    "params": ["creator", "name_seed", "json_meta", "owner", "active", "memo_key"]
}, {
    "method": "broadcast_transaction",
    "params": ["tx"]
}, {
    "method": "get_transaction_digest",
    "params": ["tx", 'chain_id']
}, {
    "method": "sign_digest",
    "params": ["digest", 'private_key']
}, {
    "method": "add_signature",
    "params": ["tx", 'sign']
}, {
    "method": "get_account_name_from_seed",
    "params": ["seed"]
}, {
    "method": "account_exist",
    "params": ["account_name"]
}, {
    "method": "get_account_history",
    "params": ["account", "from", "limit"]
}, {
    "method": "get_active_authority",
    "params": ["account_name"]
}, {
    "method": "get_owner_authority",
    "params": ["account_name"]
}, {
    "method": "get_memo_key",
    "params": ["account_name"]
}, {
    "method": "get_account_balance",
    "params": ["account_name"]
}, {
    "method": "get_vesting_balance",
    "params": ["account_name"]
}, {
    "method": "update_account",
    "params": ["account_name", "json_meta", "owner", "active", "memo"]
}, {
    "method": "delete_account",
    "params": ["account_name"]
}, {
    "method": "transfer",
    "params": ["from", "to", "amount", "memo"]
}, {

    "method": "transfer_to_vesting",
    "params": ["from", "to", "amount"]
}, {

    "method": "set_voting_proxy",
    "params": ["account_to_modify", "proxy"]
}, {

    "method": "vote_for_witness",
    "account_to_vote": ["witness_to_vote_for", "approve=true"]
}, {

    "method": "withdraw_vesting",
    "params": ["from", "vesting_shares"]
}, {

    "method": "update_witness",
    "params": ["witness_name", "url", "block_signing_key", "props"]
}];