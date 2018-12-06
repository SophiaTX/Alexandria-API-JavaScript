let sophia1=require('../lib/api');
let sophia2=require('../lib/auth');
//Sophia Connection
//sophia1.setOptions({ url: 'http://﻿127.0.0.1:9195' });
//Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
// sophia1.createAccount('initminer','test5678651','5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w','{}','SPH8k1nMRRLhuLzS17xM6pzZWW1Msbz42wCgxBqMtVY8f1ZsFqBVo','SPH8k1nMRRLhuLzS17xM6pzZWW1Msbz42wCgxBqMtVY8f1ZsFqBVo',
//      'SPH8k1nMRRLhuLzS17xM6pzZWW1Msbz42wCgxBqMtVY8f1ZsFqBVo',function(err,response){
//       console.log(err,response);
//  });
//  console.log(sophia.auth.isWif('5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1y'));
//  //Delete account using user's PrivateKey
//   sophia.api.deleteAccount('test4574','5KMk75baVwnjmKoEaKxioxNy4BXjLzfbCVqUdE1yUo48tgzU5FF',function(err,response){
//       console.log(err,response);
//   });
//   //Update ActiveKey, OwnerKey, MemoKey and JsonMetadata of the account using user's PrivateKey
// sophia1.updateAccount('K2F_dnhaRXbSMJLAsCe6FJhmOKU','{"name":"tester1"}','SPH5o2V32evStYJwAgewNmsvtk7n178CygWmwdEVR6uyThATBwVwi','SPH5o2V32evStYJwAgewNmsvtk7n178CygWmwdEVR6uyThATBwVwi',
//    'SPH5o2V32evStYJwAgewNmsvtk7n178CygWmwdEVR6uyThATBwVwi','5KMk75baVwnjmKoEaKxioxNy4BXjLzfbCVqUdE1yUo48tgzU5FF',function(err,response){
//     console.log(err,response);
// });
//   //Transfer an amount (in the form of "amount currencySymbol, 10.000 SPHTX") to other account with a memo (receipt/details) attached to the transfer using Sender's Priavtekey.
// sophia1.transfer('initminer', 'kcELPA6j3SjShc3CRmjCwk9yf-w', '1000.000 SPHTX', 'transfer to testing', '5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w',function(err,response){
//     console.log(err,response);
//  });
//     //Set a proxy account for doing votes on behalf of first account.
//  sophia.api.setVotingProxy('PcQ-byG-3OczM99qg1m_6zU9Ar', '7G6QXTWZW1rRYdixqyDeoktFLrM','5K14hP7ziUNqZbp75o4oW885259T1SbCinZskXhz3XnA2ymR1Wz',function(err,response){
//      console.log(err,response);
//  });
//     //Transfer amount (in the form of "amount (space) currencySymbol, 10.000 SPHTX") to Vesting.
//  sophia1.transferToVesting('yofVXV_6Rdaun-yWM7U1I0m8G0w', 'yofVXV_6Rdaun-yWM7U1I0m8G0w', '10.000 SPHTX','5HpSFkogryJQXNM4RtuvqDJtQEVDyTHwUS26bhLfhGuToifCRyx',function(err,response){
//      console.log(err,response);
//  });
//     //Withdraw amount (in the form of "amount currencySymbol, 10.000 SPHTX") from Vesting in fractions.
//  sophia.api.withdrawVesting('rumGMWVHCxedjhSHMBQYk3o9LVD', '10.000000 VESTS','5JPwY3bwFgfsGtxMeLkLqXzUrQDMAsqSyAZDnMBkg7PDDRhQgaV',function(err,response){
//      console.log(err,response);
//  });
//     //Vote for a witness using witness name and voter's PrivateKey
//  sophia1.voteForWitness('FAxz63F9p8JBhkXza7JlQ1yIgvI', 'initminer', true,'5JuMwaA1F4WzfhPLgDE7TUHyZsevUqmigEYQ6QobfyTKSa2Lyw8',function(err,response){
//      console.log(err,response);
//   });
//    //Send binary data to the list of recipients
//    let to=['K2F_dnhaRXbSMJLAsCe6FJhmOKU','78hdrwwwgooglecomappli'];
//   let data='SGVsbG878=';
//   sophia1.makeCustomBinaryOperation(2098877, 'sanjiv', to, data, '5KUbCiBJac8omkwgftfkp8hUCgh5k2H3mgoqMDN7bfzDLLEK2i8', function(err,response){
//       console.log(err, response);
//   });
//       //Send JSON data to the list of recipients
//   let to=['matej'];
//   let data='{ "command": { "name": "AcceptDocument", "data": { "documentId": "c22c3b1a-3606-48a9-bf76-38512b34e3bf", "note": "Test note" } } }';
//    sophia1.makeCustomJSONOperation(209957, 'sanjiv', to, JSON.stringify(data), '5KUbCiBJac8omkwgftfkp8hUCgh5k2H3mgoqMDN7bfzDLLEK2i8', function(err,response){
//        console.log(err,response);
//     });
 //  Get the list of received documents, it can be searched by by_sender, by_recipient,by_sender_datetime,by_recipient_datetime.
 //     sophia1.getReceivedDocuments(209957, 'matej', 'by_sender', '2018-09-30T09:35:13.85251Z', '1000', function(err,response){
 //         console.log(err,response);
 //      });
//Get the information about the blockchain
// sophia1.about(function(err, response){
//   console.log(err, response);
// });

//   //Get help to work with the blockchain, this returns recent updates about the blockchain.
// sophia.api.info(function(err, response){
//     console.log(err, response);
// });
//  //   //Get help to work with the blockchain, this returns all the method and necessary details about the blockchain its functionalities.
//  sophia.api.help(function(err, response){
//      console.log(err, response);
//  });
//   //Get details about the block using block_id
// sophia.api.getBlock('1983',function(err, response){
//     console.log(err, response);
// });
//   //Get details of operations inside a block
// sophia.api.getOpsInBlock('1983454',true,function(err, response){
//     console.log(err, response);
// });
//   //Get account details
//   sophia1.getAccount('sanjiv', function(err, response){
//         console.log(err, response);
//     });
  //Get list of Witnesses or miners
sophia1.listWitnesses('initminer','10',function(err, response){
    console.log(err, response);
});
//     //Get list of Witnesses by votes
//   sophia.api.listWitnessesByVote('martyn','10',function(err, response){
//       console.log(err, response);
//   });
//   //Get details about a Witness
// sophia1.getWitness('initminer',function(err, response){
//     console.log(err, response);
// });
//   //Check if the account still exists
//  sophia.api.accountExist('test45747477ww1245565768910111234',function(err, response){
//      console.log(err, response);
//  });
//  // Get transaction history of an account
//  sophia1.getAccountHistory('K2F_dnhaRXbSMJLAsCe6FJhmOKU','-1','1000',function(err, response){
//     console.log(response);
//  });
//
//     // Get Account History filtered using its type (transfer, transfer_to_vesting, witness_update, account_create etc.)
//    sophia.api.getAccountHistoryByType('matej', 'account_create', '1000', '10000',function(err, response){
//        console.log(err, response);
//     });
//   sophia.api.getAccountTransferHistory('matej','12','10',function(err, response){
//       console.log(err, response);
//   });
//
//    // Get transaction details using transaction id
//    sophia1.getTransaction('facd4ec5574d0f5fbd13be9b29b2f250502a2e38',function(err, response){
//        console.log(err, response);
//    });
//    //Get feed history
//  sophia.api.getFeedHistory('USD',function(err, response){
//      console.log(err, response);
//  });
//   //Get ActiveKey related to the account
//  sophia.api.getActiveAuthority('ArkTree1',function(err, response){
//      console.log(err, response);
//  });
//    //Get MemoKey related to the account
//  sophia.api.getMemoKey('ArkTree1',function(err, response){
//      console.log(err, response);
//  });
//  // Get OwnerKey related to the account
//  sophia.api.getOwnerAuthority('ArkTree1',function(err, response){
//      console.log(err, response);
//  });
//     //Get account balance of an account
// sophia1.getAccountBalance('kcELPA6j3SjShc3CRmjCwk9yf-w',function(err, response){
//     console.log(err, response);
// });
// Get account name using the seed(Any data string including uppercase,lowercase and numbers) used to create the account.
//   sophia1.getAccountNameFromSeed('waifei',function(err, response){
//         console.log(err, response);
//    });
//   //Get vesting balance of the account
//  sophia.api.getVestingBalance('abc',function(err, response){
//      console.log(err, response);
//  });
// //sponsoring account
//      sophia.api.sponsorAccountFees('s5G5X1XpmpqScNJxvdncPI2KgNw','EuQKN6Czvl9s4rpU52_ot1q1NIM','true','5K14hP7ziUNqZbp75o4oW885259T1SbCinZskXhz3XnA2ymR1Wz',function(err, response){
//          console.log(err, response);
//      });
//
// sophia1.setOptions({url: 'http://devnet.sophiatx.com:9193' });
// var args = { holder: 'matej' };
// sophia1.callPlugin('track_and_trace','get_holdings',args,function(err, response){
//     console.log(err, response);
// });
//     // generates separate public key for each of the roles
// console.log(sophia.auth.generatePublicKey('sanjiv','abcde'));
//     // validates account name if it can be set or not
// console.log(sophia.utils.validateAccountName('dan home ace'));
//    // generates public key and private key pair
// console.log(sophia2.getKeyPair('waifei','malesiya'));
//     //checks the format of Public key and decides if it is valid with prefix
// console.log(sophia.auth.isPubkey('SPH6ixMvJ79yR23tZgN7vF7N55z4yJMhFiAWnTtCYXjEVZUoTnBFn','SPH'));
//     //checks the format of Private key and decides if it is valid
// console.log(sophia.auth.isWif('5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w'));
// console.log(sophia.auth.createSignature("ac66593dc9b3de89329fba9fdf5b0153ec1d71a31a1fafb73ac58fb73ea05bec","5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1l"));
//     //returns public key on supplied Private key
//console.log(sophia2.wifToPublic('5KMk75baVwnjmKoEaKxioxNy4BXjLzfbCVqUdE1yUo48tgzU5FF'));
//     //matches public key with private key returns boolean value
// console.log(sophia.auth.wifIsValid('5JPwY3bwFgfsGtxMeLkLqXzUrQDMAsqSyAZDnMBkg7PDDRhQgaV','SPH8Xg6cEbqPCY8jrWFccgbCq5Fjw1okivwwmLDDgqQCQeAk7jedu'));
//     //Corrects the caps and spaces in distorted passPhrase (brainKey)
// console.log(sophia.auth.normalizeBrainKey('DERRIDE BASCULE NIMBUS DOXA BURL AURALLY OER GOSSIPY BEHALE PINKER INVOKER YAULD HOYLE POTTY TITE WHUD'));
// //Update witness is the function to create a witness contender, prize feed example ([["USD",{"base":"1 USD","quote":"10 SPHTX"}]]) can be used for testing,
//   //block_key (publicKey format) is used to sign all the blocks. It also needs a description url, where the willing user can put detail about herself.
//  To become a witness user should have atleast 250,000 SPHTX in their vesting account.
// let prizeFeed=[["USD",{base: '1 USD', quote: '0.0706 SPHTX'}]];
// sophia1.updateWitness('sanjiv','http://abc.com','SPH6ixMvJ79yR23tZgN7vF7N55z4yJMhFiAWnTtCYXjEVZUoTnBFn','1.5000 SPHTX',1024670,
//     prizeFeed,'5KUbCiBJac8omkwgftfkp8hUCgh5k2H3mgoqMDN7bfzDLLEK2i8',function(err,response){
//         console.log(err,response);
// });
// sophia.api.startBroadcasting(JSON.parse('["witness_set_properties",{"fee": "0.000000 SPHTX", "owner": "initminer", "props":[["key", "5350483738773348315455614b43797362463870325a5131324d75747271334e4a7a7234317a4d5056514c45547950393463566258"]]}]'),'5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w',function(err, response){
//      console.log(err, response);
//  });
//    //use privateKey of sender's account and publicKey of receiver's account to encrypt the message
//  console.log(sophia2.encrypt64('5KMk75baVwnjmKoEaKxioxNy4BXjLzfbCVqUdE1yUo48tgzU5FF','SPH8Xg6cEbqPCY8jrWFccgbCq5Fjw1okivwwmLDDgqQCQeAk7jedu'
//   ,'Hello World of JS'));
 //use publicKey of sender's account and privateKey of receiver's account to decrypt the message
// console.log(sophia2.decrypt64('5JPwY3bwFgfsGtxMeLkLqXzUrQDMAsqSyAZDnMBkg7PDDRhQgaV','SPH5o2V32evStYJwAgewNmsvtk7n178CygWmwdEVR6uyThATBwVwi'
//  ,'o6SF4CDofxxzOMg2k3l35Xvj1fsPq6uqweuSlzleVKU='));
//  let transaction={"ref_block_num":24354,"ref_block_prefix":1983344465,"expiration":"2018-10-04T08:52:15","operations":[["account_witness_vote",{"fee":"0.000000 SPHTX","account":"initminer","witness":"matej","approve":false}]],"extensions":[],"signatures":["2051595eea752de7507032caa28667c50862f3f17baa0a3de70358eaa56a4b5cc06707f42a771b6b7cecd7ca00a13f19da125a632b0df92e641daae284e34a3c41"],"transaction_id":"e2df91500607706e9c8c682ff65cc2da9bfa5887","block_num":483107,"transaction_num":0};
//  console.log(sophia.api.getTransactionId(transaction));

