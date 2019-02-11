import types from "./types";
import SerializerImpl from "./serializer";


const {
    //id_type,
    //varint32, uint8, int64, fixed_array, object_id_type, vote_id, address,
    uint16, uint32, int16, uint64,
    string, string_binary, bytes, bool, array, account_name_type,symbol_type,
    // protocol_id_type,
    static_variant, map, set,
    public_key,
    time_point_sec,
    optional,
    asset,
} = types;

const future_extensions = types.void;
const hardfork_version_vote = types.void;
const version = types.void;

// Place-holder, their are dependencies on "operation" .. The final list of
// operations is not avialble until the very end of the generated code.
// See: operation.st_operations = ...

const operation = static_variant();
module.exports.operation = operation;

// For module.exports
const Serializer=function(operation_name, serilization_types_object){
    const s = new SerializerImpl(operation_name, serilization_types_object);
    return module.exports[operation_name] = s;
};

const beneficiaries = new Serializer("beneficiaries", {
    account: string,
    weight: uint16
});

const comment_payout_beneficiaries = new Serializer(0, {
    beneficiaries: set(beneficiaries)
});

// Custom-types after Generated code

// ##  Generated code follows
// -------------------------------
/*
When updating generated code (fix closing notation)
Replace:  var operation = static_variant([
with:     operation.st_operations = [

Delete (these are custom types instead):
let public_key = new Serializer( 
    "public_key",
    {key_data: bytes(33)}
);

let asset = new Serializer( 
    "asset",
    {amount: int64,
    symbol: uint64}
);

Replace: authority.prototype.account_authority_map
With: map((string), (uint16))
*/

let signed_transaction = new Serializer(
    "signed_transaction", {
        ref_block_num: uint16,
        ref_block_prefix: uint32,
        expiration: time_point_sec,
        operations: array(operation),
        extensions: set(future_extensions),
        signatures: array(bytes(65))
    }
);

let signed_block = new Serializer(
    "signed_block", {
        previous: bytes(20),
        timestamp: time_point_sec,
        witness: account_name_type,
        transaction_merkle_root: bytes(20),
        extensions: set(static_variant([
            future_extensions,
            version,
            hardfork_version_vote
        ])),
        witness_signature: bytes(65),
        transactions: array(signed_transaction)
    }
);

let block_header = new Serializer(
    "block_header", {
        previous: bytes(20),
        timestamp: time_point_sec,
        witness: account_name_type,
        transaction_merkle_root: bytes(20),
        extensions: set(static_variant([
            future_extensions,
            version,
            hardfork_version_vote
        ]))
    }
);

let signed_block_header = new Serializer(
    "signed_block_header", {
        previous: bytes(20),
        timestamp: time_point_sec,
        witness: account_name_type,
        transaction_merkle_root: bytes(20),
        extensions: set(static_variant([
            future_extensions,
            version,
            hardfork_version_vote
        ])),
        witness_signature: bytes(65)
    }
);

let vote = new Serializer(
    "vote", {
        fee: asset,
        voter: account_name_type,
        author: account_name_type,
        permlink: string,
        weight: int16
    }
);

let comment = new Serializer(
    "comment", {
        parent_author: account_name_type,
        parent_permlink: string,
        author: account_name_type,
        permlink: string,
        title: string,
        body: string,
        json_metadata: string
    }
);

let transfer = new Serializer(
    "transfer", {
        fee: asset,
        from: account_name_type,
        to: account_name_type,
        amount: asset,
        memo: string
    }
);

let transfer_to_vesting = new Serializer(
    "transfer_to_vesting", {
        fee: asset,
        from: account_name_type,
        to: account_name_type,
        amount: asset
    }
);

let withdraw_vesting = new Serializer(
    "withdraw_vesting", {
        fee: asset,
        account: account_name_type,
        vesting_shares: asset
    }
);

let limit_order_create = new Serializer(
    "limit_order_create", {
        owner: account_name_type,
        orderid: uint32,
        amount_to_sell: asset,
        min_to_receive: asset,
        fill_or_kill: bool,
        expiration: time_point_sec
    }
);

let limit_order_cancel = new Serializer(
    "limit_order_cancel", {
        owner: account_name_type,
        orderid: uint32
    }
);

let convert = new Serializer(
    "convert", {
        owner: account_name_type,
        requestid: uint32,
        amount: asset
    }
);

var authority = new Serializer(
    "authority", {
        weight_threshold: uint32,
        account_auths: map((string), (uint16)),
        key_auths: map((public_key), (uint16))
    }
);

let account_create = new Serializer(
    "account_create", {
        fee: asset,
        creator: account_name_type,
        name_seed: string,
        owner: authority,
        active: authority,
        memo_key: public_key,
        json_metadata: string
    }
);

let account_update = new Serializer(
    "account_update", {
        fee: asset,
        account: account_name_type,
        owner: optional(authority),
        active: optional(authority),
        memo_key: public_key,
        json_metadata: string
    }
);
let price = new Serializer(
    "price", {
        base: asset,
        quote: asset,
    }
);
let chain_properties = new Serializer(
    "chain_properties", {
        account_creation_fee: asset,
        maximum_block_size: uint32,
        price_feeds: map(symbol_type,price)
    }
);
let witness_update = new Serializer(
    "witness_update", {
        fee: asset,
        owner: account_name_type,
        url: string,
        block_signing_key: public_key,
        props: chain_properties,
    }
);
let witness_stop=new Serializer(
    "witness_stop",{
        fee:asset,
        owner:account_name_type
    }
);
let witness_set_properties=new Serializer(
    "witness_set_properties",
    {
        fee:asset,
        owner:account_name_type,
        props:map((string), (bytes())),
        extensions: set(static_variant([
            future_extensions
        ])),
    }
);
let feed_publish = new Serializer(
    "feed_publish", {
        publisher: account_name_type,
        exchange_rate: price
    }
);
let account_witness_vote = new Serializer(
    "account_witness_vote", {
        fee: asset,
        account: account_name_type,
        witness: account_name_type,
        approve: bool
    }
);

let account_witness_proxy = new Serializer(
    "account_witness_proxy", {
        fee: asset,
        account: account_name_type,
        proxy: account_name_type
    }
);

let pow = new Serializer(
    "pow", {
        worker: public_key,
        input: bytes(32),
        signature: bytes(65),
        work: bytes(32)
    }
);

let custom = new Serializer(
    "custom", {
        required_auths: set(string),
        id: uint16,
        data: bytes()
    }
);

let report_over_production = new Serializer(
    "report_over_production", {
        reporter: string,
        first_block: signed_block_header,
        second_block: signed_block_header
    }
);

let delete_comment = new Serializer(
    "delete_comment", {
        author: account_name_type,
        permlink: string
    }
);

let custom_json = new Serializer(
    "custom_json", {
        fee:asset,
        sender:account_name_type,
        recipients:set(account_name_type),
        app_id:uint64,
        json: string
    }
);

let comment_options = new Serializer(
    "comment_options", {
        author: account_name_type,
        permlink: string,
        max_accepted_payout: asset,
        percent_steem_dollars: uint16,
        allow_votes: bool,
        allow_curation_rewards: bool,
        extensions: set(static_variant([
            comment_payout_beneficiaries
        ]))
    }
);

let set_withdraw_vesting_route = new Serializer(
    "set_withdraw_vesting_route", {
        from_account: account_name_type,
        to_account: account_name_type,
        percent: uint16,
        auto_vest: bool
    }
);

let limit_order_create2 = new Serializer(
    "limit_order_create2", {
        owner: account_name_type,
        orderid: uint32,
        amount_to_sell: asset,
        exchange_rate: price,
        fill_or_kill: bool,
        expiration: time_point_sec
    }
);

let challenge_authority = new Serializer(
    "challenge_authority", {
        challenger: account_name_type,
        challenged: account_name_type,
        require_owner: bool
    }
);

let prove_authority = new Serializer(
    "prove_authority", {
        challenged: account_name_type,
        require_owner: bool
    }
);

let request_account_recovery = new Serializer(
    "request_account_recovery", {
        fee:asset,
        recovery_account: account_name_type,
        account_to_recover: account_name_type,
        new_owner_authority: authority,
        extensions: set(future_extensions)
    }
);

let recover_account = new Serializer(
    "recover_account", {
        fee:asset,
        account_to_recover: account_name_type,
        new_owner_authority: authority,
        recent_owner_authority: authority,
        extensions: set(future_extensions)
    }
);

let change_recovery_account = new Serializer(
    "change_recovery_account", {
        fee:asset,
        account_to_recover: account_name_type,
        new_recovery_account: account_name_type,
        extensions: set(future_extensions)
    }
);

let escrow_transfer = new Serializer(
    "escrow_transfer", {
        fee:asset,
        from: account_name_type,
        to: account_name_type,
        agent: account_name_type,
        escrow_id: uint32,
        sophiatx_amount: asset,
        escrow_fee: asset,
        ratification_deadline: time_point_sec,
        escrow_expiration: time_point_sec,
        json_meta: string
    }
);

let escrow_dispute = new Serializer(
    "escrow_dispute", {
        fee:asset,
        from: account_name_type,
        to: account_name_type,
        agent: account_name_type,
        who: account_name_type,
        escrow_id: uint32
    }
);

let escrow_release = new Serializer(
    "escrow_release", {
        fee:account_name_type,
        from: account_name_type,
        to: account_name_type,
        agent: account_name_type,
        who: account_name_type,
        receiver: account_name_type,
        escrow_id: uint32,
        sophiatx_amount: asset
    }
);

let pow2_input = new Serializer(
    "pow2_input", {
        worker_account: account_name_type,
        prev_block: bytes(20),
        nonce: uint64
    }
);

let pow2 = new Serializer(
    "pow2", {
        input: pow2_input,
        pow_summary: uint32
    }
);

let equihash_proof = new Serializer(
    "equihash_proof", {
        n: uint32,
        k: uint32,
        seed: bytes(32),
        inputs: array(uint32)
    }
);

let equihash_pow = new Serializer(
    "equihash_pow", {
        input: pow2_input,
        proof: equihash_proof,
        prev_block: bytes(20),
        pow_summary: uint32
    }
);

let escrow_approve = new Serializer(
    "escrow_approve", {
        fee:asset,
        from: account_name_type,
        to: account_name_type,
        agent: account_name_type,
        who: account_name_type,
        escrow_id: uint32,
        approve: bool
    }
);

let transfer_to_savings = new Serializer(
    "transfer_to_savings", {
        from: account_name_type,
        to: account_name_type,
        amount: asset,
        memo: string
    }
);

let transfer_from_savings = new Serializer(
    "transfer_from_savings", {
        from: account_name_type,
        request_id: uint32,
        to: account_name_type,
        amount: asset,
        memo: string
    }
);
let cancel_transfer_from_savings = new Serializer(
    "cancel_transfer_from_savings", {
        from: account_name_type,
        request_id: uint32
    }
);
let custom_binary = new Serializer(
    "custom_binary", {
        fee:asset,
        sender:account_name_type,
        recipients:set(account_name_type),
        app_id:uint64,
        data: bytes()
    }
);
let decline_voting_rights = new Serializer(
    "decline_voting_rights", {
        account: account_name_type,
        decline: bool
    }
);
let reset_account = new Serializer(
    "reset_account", {
        fee:asset,
        reset_account: account_name_type,
        account_to_reset: account_name_type,
        new_owner_authority: authority
    }
);
let set_reset_account = new Serializer(
    "set_reset_account", {
        fee:asset,
        account: account_name_type,
        current_reset_account: account_name_type,
        reset_account: string
    }
);
let claim_reward_balance = new Serializer(
    "claim_reward_balance", {
        account: account_name_type,
        reward_steem: account_name_type,
        reward_sbd: asset,
        reward_vests: asset
    }
);
let delegate_vesting_shares = new Serializer(
    "delegate_vesting_shares", {
        delegator: string,
        delegatee: string,
        vesting_shares: asset
    }
);
let account_create_with_delegation = new Serializer(
    "account_create_with_delegation", {
        fee: asset,
        delegation: asset,
        creator: account_name_type,
        new_account_name: account_name_type,
        owner: authority,
        active: authority,
        posting: authority,
        memo_key: public_key,
        json_metadata: string,
        extensions: set(future_extensions)
    }
);
let fill_convert_request = new Serializer(
    "fill_convert_request", {
        owner: account_name_type,
        requestid: uint32,
        amount_in: asset,
        amount_out: asset
    }
);
let author_reward = new Serializer(
    "author_reward", {
        author: account_name_type,
        permlink: string,
        sbd_payout: asset,
        steem_payout: asset,
        vesting_payout: asset
    }
);
let curation_reward = new Serializer(
    "curation_reward", {
        curator: account_name_type,
        reward: asset,
        comment_author: account_name_type,
        comment_permlink: string
    }
);
let comment_reward = new Serializer(
    "comment_reward", {
        author: account_name_type,
        permlink: string,
        payout: asset
    }
);
let liquidity_reward = new Serializer(
    "liquidity_reward", {
        owner: account_name_type,
        payout: asset
    }
);
let interest = new Serializer(
    "interest", {
        owner: account_name_type,
        interest: asset
    }
);
let fill_vesting_withdraw = new Serializer(
    "fill_vesting_withdraw", {
        from_account: account_name_type,
        to_account: account_name_type,
        withdrawn: asset,
        deposited: asset
    }
);

let fill_order = new Serializer(
    "fill_order", {
        current_owner: account_name_type,
        current_orderid: uint32,
        current_pays: asset,
        open_owner: account_name_type,
        open_orderid: uint32,
        open_pays: asset
    }
);

let shutdown_witness = new Serializer(
    "shutdown_witness",
    {owner: account_name_type}
);

let fill_transfer_from_savings = new Serializer(
    "fill_transfer_from_savings", {
        from: account_name_type,
        to: account_name_type,
        amount: asset,
        request_id: uint32,
        memo: string
    }
);

let hardfork = new Serializer(
    "hardfork",
    {hardfork_id: uint32}
);

let comment_payout_update = new Serializer(
    "comment_payout_update", {
        author: account_name_type,
        permlink: string
    }
);

let return_vesting_delegation = new Serializer(
    "return_vesting_delegation", {
        account: account_name_type,
        vesting_shares: asset
    }
);

let comment_benefactor_reward = new Serializer(
    "comment_benefactor_reward", {
        benefactor: account_name_type,
        author: account_name_type,
        permlink: string,
        reward: asset
    }
);
let account_delete = new Serializer(
    "account_delete", {
        fee:asset,
        account: account_name_type
    }
);
let sponsor_fees= new Serializer(
    "sponsor_fees",{
        fee:asset,
        sponsor:account_name_type,
        sponsored:account_name_type,
        is_sponsoring:bool
    }
);
let producer_reward = new Serializer(
    "producer_reward", {
        producer: account_name_type,
        vesting_shares: string
    }
);
let promotion_pool_withdraw = new Serializer(
    "promotion_pool_withdraw", {
        to_account: account_name_type,
        withdrawn: asset
    }
);
let application_create = new Serializer(
    "application_create", {
        fee:asset,
        author:account_name_type,
        name:string,
        url:string,
        metadata: string,
        price_param:uint16
    }
);
let application_update = new Serializer(
    "application_update", {
        fee:asset,
        new_author:optional(account_name_type),
        name:string,
        url:string,
        metadata: string,
        price_param:optional(uint16)
    }
);
let application_delete = new Serializer(
    "application_delete", {
        fee:asset,
        author:account_name_type,
        name:string
    }
);
let buy_application = new Serializer(
    "buy_application", {
        fee:asset,
        buyer:account_name_type,
        app_id:uint64,
    }
);
let cancel_application_buying = new Serializer(
    "cancel_application_buying", {
        fee:asset,
        app_owner:account_name_type,
        buyer:account_name_type,
        app_id:uint64
    }
);
let transfer_from_promotion_pool = new Serializer(
    "transfer_from_promotion_pool", {
        fee:asset,
        transfer_to:account_name_type,
        extensions:set(future_extensions)
    }
);
let sponsor_fees_operation = new Serializer(
    "sponsor_fees_operation", {
        fee:asset,
        sponsor:account_name_type,
        sopnsored:account_name_type,
        is_sponsoring:bool,
        extensions: set(future_extensions)
    }
);
operation.st_operations=[
    transfer,
    transfer_to_vesting,
    withdraw_vesting,
    feed_publish,

    account_create,
    account_update,
    account_delete,

    witness_update,
    witness_stop,
    account_witness_vote,
    account_witness_proxy,
    witness_set_properties,

    custom,
    custom_json,
    custom_binary,

    request_account_recovery,
    recover_account,
    change_recovery_account,
    escrow_transfer,
    escrow_dispute,
    escrow_release,
    escrow_approve,

    reset_account,
    set_reset_account,

    application_create,
    application_update,
    application_delete,
    buy_application,
    cancel_application_buying,
    transfer_from_promotion_pool,
    sponsor_fees,

    /// virtual operations below this point

    interest,
    fill_vesting_withdraw,
    shutdown_witness,
    hardfork,
    producer_reward,
    promotion_pool_withdraw
];

let transaction = new Serializer(
    "transaction", {
        ref_block_num: uint16,
        ref_block_prefix: uint32,
        expiration: time_point_sec,
        operations: array(operation),
        extensions: set(future_extensions)
    }
);

let group_meta=new Serializer(
    "group_meta", {
    sender:optional(public_key),
    recipient:optional(public_key),
    iv:optional(string),
    data:bytes()

});
let create_group_return=new Serializer(
    "create_group_return", {
        group_name:account_name_type,
        operation_payloads:map(account_name_type,group_meta)

    });

let group_operation=new Serializer(
    "group_operation",{
        version:uint32,
        type:string, //"add" "disband" "update"
        description:string,
        new_group_name:optional(account_name_type),
        user_list:optional(set(account_name_type)),
        senders_pubkey:public_key,
        new_key:map(public_key,bytes())
});
let message_wrapper=new Serializer(
    "message_wrapper", {
        type:uint32,
        message_data:optional(bytes()),
        operation_data:optional(group_operation)

    });
let group_object=new Serializer(
    "group_object",{
        group_name:account_name_type,
        current_group_name:account_name_type,
        description: string,
        members:set(account_name_type),
        admin:account_name_type,
        group_key:string,
        current_seq:uint32
    });
//# -------------------------------
//#  Generated code end  S T O P
//# -------------------------------

// Custom Types (do not over-write)

const encrypted_memo = new Serializer(
    "encrypted_memo",
    {from: public_key,
        to: public_key,
        nonce: uint64,
        check: uint32,
        encrypted: string_binary}
);


/*

// Make sure all tests pass

npm test

*/
