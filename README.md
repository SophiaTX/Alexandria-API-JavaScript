# Alexandria.js
Alexandria.js API library for SophiaTX Blockchain 

Table of Contents
=================

- [Install](#install)
- [Help](#help)
- [Details](#details)
- [Keys](#keys)
- [Cryptography](#cryptography)
- [Accounts](#accounts)
- [Transaction](#transaction)
- [Witness](#witness)
- [Voting](#voting)


Install
=================
````
git clone https://github.com/SophiaTX/Alexandria.js.git
npm install
npm run build
````
Help
=================

 Get the current version and information about the blockchain
```js
sophia.api.about(function(err, response){
  console.log(err, response);
});
```
Get help to work with the blockchain, this returns all the method and necessary details about the blockchain and its methods.
```js
sophia.api.info(function(err, response){
    console.log(err, response);
});
```
Details
=================

Get details about the block using block_id
```js
sophia.api.getBlock(blockNumber,function(err, response){
    console.log(err, response);
});
```
Get details of operations inside a block
```js
sophia.api.getOpsInBlock(blockNumber,true,function(err, response){
    console.log(err, response);
});
```
Check if the account still exists
```js
 sophia.api.accountExist(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get transaction history of an account from (-1 means most recent entry) and limit (number of data to be displayed)
 ```js
 sophia.api.getAccountHistory(accountName,from,limit,function(err, response){
     console.log(err, response);
 });
 ```
 Get ActiveKey related to the account
 ```js
 sophia.api.getActiveAuthority(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 
 Get OwnerKey related to the account
 ```js
 sophia.api.getOwnerAuthority(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get account balance of an account
 ```js
 sophia.api.getAccountBalance(accountName,function(err, response){
     console.log(err, response);
 });
 ```
 Get account name using the seed(Any data string including uppercase,lowercase and numbers) used to create the account.
 ```js
 sophia.api.getAccountNameFromSeed(accountName,function(err, response){
      console.log(err, response);
 });
 ```
 Get vesting balance of the account
 ```js
 sophia.api.getVestingBalance(accountName,function(err, response){
     console.log(err, response);
 });
 ```
  Get feed history of the currency using its symbol
  ```js
   sophia.api.getFeedHistory(symbol,function(err, response){
       console.log(err, response);
   });
 ```
 Keys
 =================
 
 Generates separate public key for each of the roles
  ```js
 console.log(sophia.auth.generateKeys(name,password));
 ```
 Validates account name whether it can be set or not
 ```js
 console.log(sophia.utils.validateAccountName(accountName));
 ```
 Generates public key and private key pair
 ```js
 console.log(sophia.auth.getPrivateKeys(name,password));
 ```
 Checks the format of Public key and decides if it is valid with prefix
 ```js
 console.log(sophia.auth.isPubkey(publicKey,prefix));
 ```
 Checks the format of Private key and decides if it is valid
 ```js
 console.log(sophia.auth.isWif(privateKey));
 ```
 Returns public key on supplied Private key
 ```js
 console.log(sophia.auth.wifToPublic(privateKey));
 ```
 Matches public key with private key returns boolean value
 ```js
 console.log(sophia.auth.wifIsValid(privateKey,publicKey));
 ```
 Corrects the caps and spaces in distorted passPhrase (brainKey)
 ```js
 console.log(sophia.auth.normalizeBrainKey(passphrase));
 ```
 Cryptography
 =================
 
  Use privateKey of sender's account and publicKey of receiver's account to encrypt the message
  ```js
  console.log(sophia.auth.encrypt(privateKey,publickey,Message));
 ```
  Use publicKey of sender's account and privateKey of receiver's account to decrypt the message
  ```js
  console.log(sophia.auth.decrypt(privateKey,publicKey,EncryptedMessage));
 ```
 
Accounts
================= 

 Create account using seed(Any data string including uppercase,lowercase and numbers), creator as Witness's name, Witness's PrivateKey and user's PublicKey as ActiveKey
 ```js
 sophia.api.createAccount(creatorName,seed,creatorPrivateKey,json_meta, owner, active, memo_key,function(err,response){
     console.log(err,response);
 });
 ```
  Delete account using user's PrivateKey
 ```js  
 sophia.api.deleteAccount(accountName,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
  Update ActiveKey, OwnerKey, MemoKey and JsonMetadata of the account using user's PrivateKey
 ```js
 sophia.api.updateAccount(accountName,jsonMeta,owner,active, memoKey,,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 Get account details
 ```js
 sophia.api.getAccount(accountName, function(err, response){
     console.log(err, response);
 });
 ```
 Transaction
 =================
 
  Transfer an amount (in the form of "amount (space) currencySymbol, 10.000 SPHTX") to other account with a memo (receipt/details) attached to the transfer using Sender's Priavtekey.
 ```js
 sophia.api.transfer(from, to, amount, memo,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 Transfer amount (in the form of "amount currencySymbol, 10.000 SPHTX") to Vesting.
  ```js
  sophia.api.transferToVesting(from, to, amount,privateKey,function(err,response){
      console.log(err,response);
  });
  ```
  Withdraw amount (in the form of "amount currencySymbol, 10.000 SPHTX") from Vesting in fractions.
  ```js
  sophia.api.withdrawVesting(from,vestingShares,privateKey,function(err,response){
      console.log(err,response);
  });
  ```
  Get transaction details using transaction id
  ```js
  sophia.api.getTransaction(transactionId,function(err, response){
       console.log(err, response);
  });
 ```
Witness
=================
Update witness is the function to update an existing account as a witness contender it needs prize feed update as an argument, 
prizeFeed example (```[["USD",{"base":"1 USD","quote":"0.187331 SPHTX"}]]```) can be used for testing,
blockSigningKey (publicKey format) is used to sign all the blocks. It also needs a description url, where the willing user can put detail about herself.
To become a witness the user must have at least 250,000 SPHTX tokens in her vesting account.
```js
  sophia.api.updateWitness(accountName, descriptionUrl, blockSigningKey, accountCreationFee, maximumBlockSizeLimit, prizeFeed, privateKey,function(err,response){
  console.log(err,response);
  });
```
Get list of Witnesses or miners
```js
sophia.api.listWitnesses(startFromWitnessName,count,function(err, response){
    console.log(err, response);
});
```
Get details about a Witness
```js
sophia.api.getWitness(witnessName,function(err, response){
    console.log(err, response);
});
```
Voting
=================

 Set a proxy account for doing votes on behalf of first account.
 ```js
 sophia.api.setVotingProxy(accountToModify, proxy,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 Vote for a witness using witness name and voter's PrivateKey
 ```js
 sophia.api.voteForWitness(witnessToVoteFor, approve=true,privateKey,function(err,response){
     console.log(err,response);
 });
 ```
 