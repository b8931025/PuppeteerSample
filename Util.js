module.exports = {
    /* save file
        options:{
            encoding: "utf8",
            flag: "w",
            mode: 0o666
        }    
    */
    saveFile : (path,value,options)=>{
        let callback = (err) => {if (err) return console.log(err)}
        require('fs').writeFile(path, value, options, callback);
    },
    //delay ms
    sleep : (delay)=>{
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
    },
    //執行command line
    execCmd : (cmd,paramAarray) => {
        const { spawn } = require("child_process");
        const ls = spawn(cmd, paramAarray);
        
        ls.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
        });
        
        ls.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });
        
        ls.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });
        
        ls.on("close", code => {
            console.log(`child process exited with code ${code}`);
        });
    },
    //download image
    downloadImage : (url, filepath)=>{
        return new Promise((resolve, reject) => {
            require('https').get(url, (res) => {
                if (res.statusCode === 200) {
                    res.pipe(require('fs').createWriteStream(filepath))
                        .on('error', reject)
                        .once('close', () => resolve(filepath));
                } else {
                    // Consume response data to free up memory
                    res.resume();
                    reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
                }
            });
        });
    },    
  };









