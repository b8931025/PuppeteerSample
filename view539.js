const puppeteer = require('puppeteer');
const internal = require('stream');
const fs = require('fs');

(async ()=>{
    var dir = './log/';
    if (!fs.existsSync(dir))fs.mkdirSync(dir);
    let fileName = `${dir}history539.txt`;

    url = 'https://www.pilio.idv.tw/lto539/list.asp?orderby=new&indexpage='
    cssSelector = "table[class='auto-style1'] > tbody > tr"
    
    //每一頁期數
    const periodPerPage = 23;
    //要爬取的期數
    let period = 10;
    //要爬取的頁數
    let pageAmount = 1;
    const args = process.argv.slice(2);

    if (args.length > 0 && !isNaN(args[0])){
        period = parseInt(args[0]);
        pageAmount = parseInt(period / periodPerPage) + 1;
    }

    let listTotal = []
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    //移除timeout限制
    await page.setDefaultNavigationTimeout(0);

    //逐頁取得資料
    lastPage = 0
    for(i of Array(pageAmount).keys()){
        lastPage = i + 1
        await page.goto(url + lastPage);
        //取得多個element
        const listPerPage = await page.$$eval(cssSelector, el => { return el.map(input => input.innerText.replace("\n","")) })
        if (listPerPage.length > 0){
            list2 = listPerPage.filter(x => x.indexOf("(") > -1).map(x => {
                let everyDay = x.split("\t");
                let date = everyDay[0];
                let lottos = everyDay[1].replace(/\s/g,'').split(',').map(no=>parseInt(no));

                return { "date":date, "lottos":lottos };
            })
            listTotal = listTotal.concat(list2)
        }else{
            //該頁無資料
            break
        }
    }
    await browser.close();

    //存檔
    fs.writeFile(fileName, JSON.stringify(listTotal).replace(/,{/g,",\n{"), 
        function (err) {
        if (err) return console.log(err);
        });

    //統計
    staticLotto(period,listTotal);        
})()

/*
period : 統計期數
listTotal : 原數據
*/
function staticLotto(period,listTotal){
    if (period > listTotal.length) throw Error("數據不足");
    
    //初始化39個號碼組，初始值為0
    let statics = Array(39).fill(0);
    
    //只取期數(period)的資料
    listTotal = listTotal.slice(0,period); 

    console.log('今彩539數據分析');
    console.log(`統計期間 ${listTotal[listTotal.length-1].date} ~ ${listTotal[0].date} 共 ${period} 期\n`);
    listTotal.forEach(x=>console.log(x.date,x.lottos));

    //統計每個號碼的出現次數
    listTotal.forEach(day => {
        day.lottos.forEach(lottoNo => statics[lottoNo - 1]++);
    });
    //產生統計物件
    statics = statics.map((x,idx)=>{
        return {"no":(idx+1).toString(),"count":x};
    });

    //按出現次數排序
    statics.sort((a,b)=> (a.count > b.count) ? -1 : (a.count < b.count) ? 1 : 0);
    //console.log(statics);
    console.log('');

    //出現次數排名
    let displayRange = statics.map(x=>x.count).filter((value,idx,self)=>self.indexOf(value) === idx);
    
    displayRange.forEach(x=>{
        let everyNo = statics.filter(y=>y.count==x).map(y=>y.no);
        let everyNoTxt = everyNo.sort().join(', ');
        console.log(`出現${x}次 >> ${everyNoTxt}`);
    });

}