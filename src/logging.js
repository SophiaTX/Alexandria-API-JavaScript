const Gelf = require('gelf');
const ip=require('ip');
const gelf = new Gelf({
    graylogPort: 12201,
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
});
gelf.setHost=function(uri){
    gelf.config.graylogHostname=uri;
};
// gelf.on('message', function (gelf) {
//      console.log(gelf.level, gelf.short_message, gelf.long_message);
//  });
// gelf.on('error', (err) => {
//     console.log('ouch!', err);
// });
gelf.ErrorMessage= function(error,endpoint){
    const message = {
        "version": "1.0",
        "facility":"AlexandriaJS",
        "host":endpoint,
    "short_message": error.name,
    "full_message": error.toString(),
    "timestamp": Date.now() / 1000,
    "level": error.code,
    "client_id":ip.address()
    };

    return message;
};
// const message = {
//     "short_message": "Short message",
//     "full_message": "Backtrace here\n\nmore stuff",
//     "timestamp": Date.now() / 1000,
//     "level": 1,
//     "line": 356,
// };
// gelf.emit('gelf.log', message);
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