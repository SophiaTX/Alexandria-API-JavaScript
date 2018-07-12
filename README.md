# Alexandria.js
Alexandria.js API library for SophiaTX Blockchain 

Table of Contents
=================

- [Install](#install)
- [Help](#help)
- [Details](#details)
- [Keys](#keys)
- [Accounts](#accounts)
- [Transaction](#transaction)
- [Witness](#witness)
- [Voting](#voting)


Install
=================
```
git clone https://github.com/SophiaTX/Alexandria.js.git
npm install
npm run build
```
Help
=================

 Get the information about the blockchain
```js
steem.api.about(function(err, response){
  console.log(err, response);
});
```
Get help to work with the blockchain, this returns all the method and necessary details about the blockchain its functionalities.
```js
steem.api.info(function(err, response){
    console.log(err, response);
});
```
Details
=================

Get details about the block using block_id
```js
steem.api.getBlock(blockNumber,function(err, response){
    console.log(err, response);
});
```
Get details of operations inside a block
```js
steem.api.getOpsInBlock(blockNumber,true,function(err, response){
    console.log(err, response);
});
```
Check if the account still exists
```js
 steem.api.accountExist(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get transaction history of an account
 ```js
 steem.api.getAccountHistory(accountName,from,to,function(err, response){
     console.log(err, response);
 });
 ```
 Get ActiveKey related to the account
 ```js
 steem.api.getActiveAuthority(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 
 Get OwnerKey related to the account
 ```js
 steem.api.getOwnerAuthority(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get account balance of an account
 ```js
 steem.api.getAccountBalance(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get account name using the seed(Any data string including uppercase,lowercase and numbers) used to create the account.
 ```js
 steem.api.getAccountNameFromSeed(accountName,function(err, response){
      console.log(err, response);
 });
 ```
 Get vesting balance of the account
 ```js
 steem.api.getVestingBalance(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Keys
 =================
 
 generates separate public key for each of the roles
  ```js
 console.log(steem.auth.generateKeys(name,password));
 ```
 validates account name if it can be set or not
 ```js
 console.log(steem.utils.validateAccountName(accountName));
 ```
 generates public key and private key pair
 ```js
 console.log(steem.auth.getPrivateKeys(name,password));
 ```
 checks the format of Public key and decides if it is valid with prefix
 ```js
 console.log(steem.auth.isPubkey(publicKey,prefix));
 ```
 checks the format of Private key and decides if it is valid
 ```js
 console.log(steem.auth.isWif(privateKey));
 ```
 returns public key on supplied Private key
 ```js
 console.log(steem.auth.wifToPublic(privateKey));
 ```
 matches public key with private key returns boolean value
 ```js
 console.log(steem.auth.wifIsValid(privateKey,publicKey));
 ```
 Corrects the caps and spaces in distorted passPhrase (brainKey)
 ```js
 console.log(steem.auth.normalizeBrainKey(passphrase));
 ```
Accounts
================= 

  Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
 ```js
 steem.api.createAccountTransaction(witnessName,seed,witnessPrivateKey,json_meta, owner, active, memo_key,function(err,response){
     console.log(err,response);
 });
 ```
  Delete account using user's PrivateKey
 ```js  
 steem.api.deleteAccountTransaction(accountName,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
   Update ActiveKey, OwnerKey, MemoKey and JsonMetadata of the account using user's PrivateKey
 ```js
 steem.api.updateAccountTransaction(accountName,privateKey,jsonMeta,owner,active, memoKey,function(err,response){
     console.log(err,response);
 });
 ```
 Get account details
 ```js
 steem.api.getAccount(accountName, function(err, response){
     console.log(err, response);
 });
 ```
 Transaction
 =================
 
  Transfer an amount (in the form of "amount currencySymbol, 10.000 SPHTX") to other account with a memo (receipt/details) attached to the transfer using Sender's Priavtekey.
 ```js
 steem.api.transferTransaction(from, to, amount, memo,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 Transfer amount (in the form of "amount currencySymbol, 10.000 SPHTX") to Vesting.
  ```js
  steem.api.transferToVestingTransaction(from, to, amount,privateKey,function(err,response){
      console.log(err,response);
  });
  ```
  Withdraw amount (in the form of "amount currencySymbol, 10.000 SPHTX") from Vesting in fractions.
  ```js
  steem.api.withdrawVestingTransaction(from,vestingShares,privateKey,function(err,response){
      console.log(err,response);
  });
  ```
 
 
Witness
=================

Get list of Witnesses or miners
```js
steem.api.listWitnesses(startFromWitnessName,count,function(err, response){
    console.log(err, response);
});
```
Get details about a Witness
```js
steem.api.getWitness(witnessName,function(err, response){
    console.log(err, response);
});
```
Voting
=================

 Set a proxy account for doing votes on behalf of first account.
 ```js
 steem.api.setVotingProxyTransaction(accountToModify, proxy,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 Vote for a witness using witness name and voter's PrivateKey
 ```js
 steem.api.voteForWitnessTransaction(witnessToVoteFor, approve=true,privateKey,function(err,response){
     console.log(err,response);
 });
 ```

