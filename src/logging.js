const Gelf = require('gelf');
const gelf = new Gelf({
     graylogPort: 12201,
    graylogHostname:'logging.sophiatx.com',
    connection: 'wan',
    facility:'local7',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
});
gelf.on('message', function (gelf) {
     console.log(gelf.level, gelf.short_message, gelf.long_message);
 });
gelf.send('error', (err, response) => {
    console.log('ouch!', response);
    gelf.sendMessage("hello",(err,response)=>{
        if(err)
            console.log(err);

        else
            console.log(response);
    });
});
// var gelf = require('node-gelf')({
//     host: 'graylog.server.local',
//         port: 23923
// });
// gelf.on('message', function (gelf) {
//     console.log(gelf.level, gelf.short_message, gelf.long_message)
// });
module.exports=gelf;