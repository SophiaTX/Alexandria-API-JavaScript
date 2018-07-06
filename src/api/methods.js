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
    }

];
