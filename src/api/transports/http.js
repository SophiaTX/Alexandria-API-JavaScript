import fetch from 'cross-fetch';
import Transport from './base';


class RPCError extends Error {
  constructor(rpcError) {
    super(rpcError.message);
    this.name = 'RPCError';
    this.code = rpcError.code;
    this.data = rpcError.data;
  }
}

export function jsonRpc(uri, {method, id, params}) {
    const payload = {id, jsonrpc: '2.0', method, params};
    return fetch(uri, {
        body: JSON.stringify(payload),
        method: 'POST',

        headers: {
            Accept: 'application/json, text/plain, */*',

        },
    }).then(response => {
        // if (!response.ok) {
        //     throw new Error(`HTTP ${ response.status }: ${ response.statusText }`);
        // }
        return response.json();
    }).then(rpcRes => {
        if (rpcRes.id !== id) {
            throw new Error(`Invalid response id: ${ rpcRes.id }`);
        }
        if (rpcRes.error) {
            throw new RPCError(rpcRes.error);
        }
        return rpcRes.result;
    }).catch(err => {
        throw err;
    });

}

export default class HttpTransport extends Transport {
  send(api, data, callback) {
    if (this.options.useAppbaseApi) {
        api = 'condenser_api';
    }
    const id = data.id || this.id++;
    const params = [api, data.method, data.params];
    jsonRpc(this.options.uri, {method: 'call', id, params})
      .then(res => { callback(null, res); }, err => { callback(err); });
  }
}
