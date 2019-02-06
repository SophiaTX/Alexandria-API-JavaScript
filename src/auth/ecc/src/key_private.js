const ecurve = require('ecurve');
const Point = ecurve.Point;
const secp256k1 = ecurve.getCurveByName('secp256k1');
const BigInteger = require('bigi');
const assert = require('assert');

const hash = require('./hash');
const PublicKey = require('./key_public');
const keyUtils = require('./key_utils');
const createHash = require('create-hash')
const promiseAsync = require('./promise-async')

const G = secp256k1.G
const n = secp256k1.n

module.exports = PrivateKey;

/**
  @typedef {string} wif - https://en.bitcoin.it/wiki/Wallet_import_format
  @typedef {string} pubkey - EOSKey..
  @typedef {ecurve.Point} Point
*/

/**
  @param {BigInteger} d
*/
function PrivateKey(d) {
    if(typeof d === 'string') {
        return PrivateKey.fromString(d)
    } else if(Buffer.isBuffer(d)) {
        return PrivateKey.fromBuffer(d)
    } else if(typeof d === 'object' && BigInteger.isBigInteger(d.d)) {
        return PrivateKey(d.d)
    }

    if(!BigInteger.isBigInteger(d)) {
        throw new TypeError('Invalid private key')
    }

    /** @return {string} private key like PVT_K1_base58privatekey.. */
    function toString() {
      return toWif()
    }

    /**
        @return  {wif}
    */
    function toWif() {
        var private_key = toBuffer();
        // checksum includes the version
        private_key = Buffer.concat([new Buffer([0x80]), private_key]);
        return keyUtils.checkEncode(private_key, 'sha256x2')
    }

    let public_key;

    /**
        @return {Point}
    */
    function toPublic() {
        if (public_key) {
            // cache
            // S L O W in the browser
            return public_key
        }
        const Q = secp256k1.G.multiply(d);
        return public_key = PublicKey.fromPoint(Q);
    }

    function toBuffer() {
        return d.toBuffer(32);
    }

    /**
      ECIES
      @arg {string|Object} pubkey wif, PublicKey object
      @return {Buffer} 64 byte shared secret
    */
    function getSharedSecret(public_key) {
        public_key = PublicKey(public_key)
        let KB = public_key.toUncompressed().toBuffer()
        let KBP = Point.fromAffine(
          secp256k1,
          BigInteger.fromBuffer( KB.slice( 1,33 )), // x
          BigInteger.fromBuffer( KB.slice( 33,65 )) // y
        )
        let r = toBuffer()
        let P = KBP.multiply(BigInteger.fromBuffer(r))
        let S = P.affineX.toBuffer({size: 32})
        // SHA512 used in ECIES
        return hash.sha512(S);
    }

    /**
      @arg {string} name - child key name.
      @return {PrivateKey}

      @example activePrivate = masterPrivate.getChildKey('owner').getChildKey('active')
      @example activePrivate.getChildKey('mycontract').getChildKey('myperm')
    */
    function getChildKey(name) {
      // console.error('WARNING: getChildKey untested against eosd'); // no eosd impl yet
      const index = createHash('sha256').update(toBuffer()).update(name).digest()
      return PrivateKey(index)
    }
    function toHex() {
        return toBuffer().toString('hex');
    }
    return {
        d,
        toWif,
        toString,
        toPublic,
        toBuffer,
        getSharedSecret,
        getChildKey
    }
}

/** @private */
function parseKey(privateStr) {
        assert(typeof privateStr, 'string', 'privateStr')
        const match = privateStr.match(/^PVT_([A-Za-z0-9]+)_([A-Za-z0-9]+)$/)
        let version;
        if (match === null) {
            // legacy WIF - checksum includes the version
            const versionKey = keyUtils.checkDecode(privateStr, 'sha256x2')
            version = versionKey.readUInt8(0);
            assert.equal(0x80, version, `Expected version ${0x80}, instead got ${version}`)
            const privateKey = PrivateKey.fromBuffer(versionKey.slice(1))
            const keyType = 'K1'
            const format = 'WIF'
            return {privateKey, format, keyType}
        }
        assert.equal(0x80, version, `Expected version ${0x80}, instead got ${version}`)
        assert(match.length === 3, 'Expecting private key like: base58privateKey..')
        const [, keyType, keyString] = match
        assert.equal(keyType, 'K1', 'private key expected')
        const privateKey = PrivateKey.fromBuffer(keyUtils.checkDecode(keyString, keyType))
        return {privateKey, format: 'PVT', keyType}
}

PrivateKey.fromHex = function(hex) {
    return PrivateKey.fromBuffer(new Buffer(hex, 'hex'));
}

PrivateKey.fromBuffer = function(buf) {
    if (!Buffer.isBuffer(buf)) {
        throw new Error("Expecting parameter to be a Buffer type");
    }
    if(buf.length === 33 && buf[32] === 1) {
      // remove compression flag
      buf = buf.slice(0, -1)
    }
    if (32 !== buf.length) {
      throw new Error(`Expecting 32 bytes, instead got ${buf.length}`);
    }
    return PrivateKey(BigInteger.fromBuffer(buf));
}

/**
    @arg {string} seed - any length string.  This is private, the same seed
    produces the same private key every time.

    @return {PrivateKey}
*/
PrivateKey.fromSeed = function(seed) { // generate_private_key
    if (!(typeof seed === 'string')) {
        throw new Error('seed must be of type string');
    }
    return PrivateKey.fromBuffer(hash.sha256(seed));
}

/**
  @arg {wif} key
  @return {boolean} true if key is in the Wallet Import Format
*/
PrivateKey.isWif = function(text) {
    try {
        assert(parseKey(text).format === 'WIF')
        return true
    } catch(e) {
        return false
    }
}

/**
  @arg {wif|Buffer|PrivateKey} key
  @return {boolean} true if key is convertable to a private key object.
*/
PrivateKey.isValid = function(key) {
    try {
        PrivateKey(key)
        return true
    } catch(e) {
        return false
    }
}

/**
    @throws {AssertError|Error} parsing key
    @arg {string} privateStr Eosio or Wallet Import Format (wif) -- a secret
*/
PrivateKey.fromString = function(privateStr) {
    return parseKey(privateStr).privateKey
}

/**
  Create a new random private key.

  Call initialize() first to run some self-checking code and gather some CPU
  entropy.

  @arg {number} [cpuEntropyBits = 0] - additional CPU entropy, this already
  happens once so it should not be needed again.

  @return {Promise<PrivateKey>} - random private key
*/
PrivateKey.randomKey = function(cpuEntropyBits = 0) {
  return PrivateKey.initialize().then(() => (
    PrivateKey.fromBuffer(keyUtils.random32ByteBuffer({cpuEntropyBits}))
  ))
}

/**
  @return {Promise<PrivateKey>} for testing, does not require initialize().
*/
PrivateKey.unsafeRandomKey = function() {
  return Promise.resolve(
    PrivateKey.fromBuffer(keyUtils.random32ByteBuffer({safe: false}))
  )
}


let initialized = false, unitTested = false

/**
  Run self-checking code and gather CPU entropy.

  Initialization happens once even if called multiple times.

  @return {Promise}
*/
function initialize() {
  if(initialized) {
    return
  }

  keyUtils.addEntropy(...keyUtils.cpuEntropy())
  assert(keyUtils.entropyCount() >= 128, 'insufficient entropy')

  initialized = true
}

PrivateKey.initialize = promiseAsync(initialize)

/** @private */
const doesNotThrow = (cb, msg) => {
  try {
    cb()
  } catch(error) {
    error.message = `${msg} ==> ${error.message}`
    throw error
  }
}
