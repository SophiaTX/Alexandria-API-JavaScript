let sophia1=require('../lib/api');
//Sophia Connection
sophia1.setOptions({ url: 'http://195.48.9.209:9093' });
// // //Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
// sophia1.createAccount('initminer','test45747477ww1245565768910189101','5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w','{}','SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK','SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK',
//     'SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK',function(err,response){
//         console.log(err,response);
// });
// console.log(sophia1.auth.getKeyPair('sanjiv','abcde'));
// sophia1.api.sophia.about(function(err, response){
//     console.log(err, response);
// });
// sophia1.functions.createAccount('initminer','test45747477ww1245565768910189101','5JKHcAHiZnPVMzzeSGrWcRPhkjFZsPy2Pf36CVaz8W2WmMP4L1w','{}','SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK','SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK',
//      'SPH7GvbxZTntaqCnNSsuai1Dguejh23RKJHmu2uuR869BLbM3yWPK',function(err,response) {
//         console.log(err, response);
// });
// sophia1.getAccountHistory('matej','10','9',function(err, response){
//     console.log(err, response);
// });
// sophia1.getOwnerAuthority('ArkTree1',function(err, response){
//     console.log(err, response);
// });
// sophia1.getAccountHistory('matus','12','1',function(err, response){
//   console.log(err, response);
//  });
sophia1.listWitnesses('initminer',10,function(err, response){
    console.log(err, response);
});
