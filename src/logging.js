const Gelf = require('gelf');
const gelf = new Gelf({
     graylogPort: 12201,
    graylogHostname:'35.159.11.184',
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
});
// gelf.on('message', function (gelf) {
//      console.log(gelf.level, gelf.short_message, gelf.long_message);
//  });
gelf.on('error', (err) => {
    console.log('ouch!', err);
});
const message = {
    "version": "1.0",
    "host": "www",
    "short_message": "Short message",
    "full_message": "Backtrace here\n\nmore stuff",
    "timestamp": Date.now() / 1000,
    "level": 1,
    "facility": "payment-backend",
    "line": 356,
    "_user_id": 42,
    "_something_else": "foo"
};
gelf.emit('gelf.log', message);
// gelf.send('error', (err, response) => {
//     console.log('ouch!', response);
//     gelf.sendMessage("hello",(err,response)=>{
//         if(err)
//             console.log(err);
//
//         else
//             console.log(response);
//     });
// });
// var gelf = require('node-gelf')({
//     host: 'graylog.server.local',
//         port: 23923
// });
// gelf.on('message', function (gelf) {
//     console.log(gelf.level, gelf.short_message, gelf.long_message)
// });
module.exports=gelf;