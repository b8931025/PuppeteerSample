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
    //statics connect number in array 
    staticConnectNo: (source)=>{
        //排序
        source.sort((a,b)=>(a-b))
      
        let static = Array(source.length).fill(0)
        let x = []
        //統計前後相差為1的連號  ex:[2,5,6,7,9] => [0,1,1,0] => "0110"
        for(i = 1;i < source.length;i++) x.push(((source[i] - source[i-1]) == 1) ? 1 : 0)
        let content = x.join("")
      
        //由大至小，從最多的連1號開始計算
        for(connectTime = source.length ; connectTime > 1; connectTime--){
          //產生數個1
          let manyOnes = "".padEnd(connectTime-1).replace(/ /g,"1")
          //檢查是否有連號
          if (content.indexOf(manyOnes) > -1) {
            content = content.replace(manyOnes,"")
            static[connectTime-1]++
          }
        }
      
        return static.map((val,idx)=>({connect:(idx+1),times:val}))
      },
    //暫停
    pause: async (msg) => {
        if (msg && msg != '') console.log(msg)
        process.stdin.setRawMode(true)
        return new Promise(resolve => process.stdin.once('data', () => {
          process.stdin.setRawMode(false)
          resolve()
        }))
    },  
  };









