export default [
    {

        "method": "about"

    },
    {

        "method": "info"

    },
    {

        "method": "help"

    },
    {

        "method": "get_witness",
        "params": ["nameOfThewitness"]

    },
    {

        "method": "list_witnesses",
        "params": ["lowerbound", "limit"]

    },


    {
      "method": "get_block",
      "params": ["blockNum"]
    },
    {
      "method": "get_ops_in_block",
      "params": ["blockNum", "onlyVirtual"]
    },

    {

      "method": "get_feed_history"
    },

    {

      "method": "get_account",
      "params": ["name"]
    },
    {
      "method": "get_transaction",
      "params": ["trxId"]
    },
    {
        "method": "create_simple_transaction",
        "params": ["tx"]
    },
    {

        "method": "create_account",
        "params": [
            "creator",
            "name_seed",
            "json_meta",
            "owner",
            "active",
            "memo_key"
        ]
    },
    {
        "method": "broadcast_transaction",
        "params": ["tx"]
    },
    {
        "method": "get_transaction_digest",
        "params": ["tx",
            'chain_id',
            ]
    },
    {
        "method": "sign_digest",
        "params": ["digest",
            'private_key',
            ]
    },
    {
        "method": "add_signature",
        "params": ["tx",
            'sign',
            ]
    },


];
