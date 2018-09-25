const Gelf = require('gelf');
const gelf = new Gelf({
    Port: 5140,
    Hostname: 'https://logging.sophiatx.com/api/',
    connection: 'wan',
    maxChunkSizeWan: 1420,
    maxChunkSizeLan: 8154
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
module.exports=gelf;