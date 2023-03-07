const puppeteer = require('puppeteer');
const internal = require('stream');
const fs = require('fs');
const util = require('./Util.js');

(async ()=>{
    var dir = `${__dirname}\\log\\`;
    if (!fs.existsSync(dir))fs.mkdirSync(dir);
    let fileName = `${dir}historyBlto.txt`;
    let pathHtml = dir + "html.txt";

    //https://www.pilio.idv.tw/ltobig/list.asp
    url = 'https://www.pilio.idv.tw/ltobig/list.asp?orderby=new&indexpage='
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
                let spNo = parseInt(everyDay[2]);
                return { "date":date, "lottos":lottos,"spNo":spNo };
            })
            listTotal = listTotal.concat(list2)
        }else{
            //該頁無資料
            break
        }
    }
    await browser.close();

    //統計
    let static = staticLotto(period,listTotal);
    let resultData = static.join('\n') + "\n\n接收資料\n" + JSON.stringify(listTotal).replace(/,{/g,",\n{") 

    //存檔
    util.saveFile(fileName, resultData)
    
    //開啟檔案
    util.execCmd("explorer", [fileName]);
})()

/*
period : 統計期數
listTotal : 原數據
*/
function staticLotto(period,listTotal){
    if (period > listTotal.length) throw Error("數據不足");
    let result = []
    
    //初始化49個號碼組，初始值為0
    let statics = Array(49).fill(0);
    
    //只取期數(period)的資料
    listTotal = listTotal.slice(0,period); 

    result.push('大樂透數據分析')
    result.push(`統計期間 ${listTotal[listTotal.length-1].date} ~ ${listTotal[0].date} 共 ${period} 期\n`)
    listTotal.forEach(x=>result.push(`${x.date} ${x.lottos} 特:${x.spNo}`));

    //統計每個號碼的出現次數
    listTotal.forEach(day => {
        day.lottos.forEach(lottoNo => statics[lottoNo - 1]++);
        statics[day.spNo - 1]++;
    });
    //產生統計物件
    statics = statics.map((x,idx)=>{
        return {"no":(idx+1).toString(),"count":x};
    });

    //按出現次數排序
    statics.sort((a,b)=> (a.count > b.count) ? -1 : (a.count < b.count) ? 1 : 0);
    result.push('')

    //出現次數排名
    let displayRange = statics.map(x=>x.count).filter((value,idx,self)=>self.indexOf(value) === idx);
    
    displayRange.forEach(x=>{
        let everyNo = statics.filter(y=>y.count==x).map(y=>y.no);
        let everyNoTxt = everyNo.sort((a,b)=> parseInt(a) - parseInt(b)).join(', ');
        result.push(`出現${x}次 >> ${everyNoTxt}`);
    });

    result.push("")
    //連續號統計
    let listSeri = Array(listTotal[0].lottos.length).fill(0).map((val,idx)=>({connect:(idx+1),times:0,dates:[]}));
    listTotal.forEach(x=>{
        let unit = util.staticConnectNo(x.lottos)
        unit.filter(y=>y.times != 0).forEach(y=>{
            let tmp = listSeri[y.connect - 1]
            tmp.times += y.times
            tmp.dates.push(x.date)
        })
    })
    listSeri = listSeri.filter(x=>x.times!=0)
    listSeri.forEach(x=>{
        result.push(`${x.connect}連號出現${x.times}次`)
        x.dates.forEach(y=>result.push(y))
        result.push('')
    })

    //出現次數(times)前三名，出現次數最多的取一個，其他取二個(amount)
    let PickSet = [  {"times":displayRange[0], "amount":0}
                    ,{"times":displayRange[1], "amount":2}
                    ,{"times":displayRange[2], "amount":2}
                    ,{"times":displayRange[3], "amount":3}];
                    
    result.push(`推薦號碼`)
    result.push(AdviceNOSet(PickSet,statics))
    result.push(AdviceNOSet(PickSet,statics))
    result.push(AdviceNOSet(PickSet,statics))

    return result;
}

//推薦號碼
function AdviceNOSet(PickSet,statics){
    let newNumber= [];
    let NowTimes = 0;
    PickSet.forEach(set => {
        if (set.amount > 0){
            NowTimes = set.times;
            let TimesArray = statics.filter(y => y.count == NowTimes);
            //該出現次數的號碼不夠，就往下一個次數少的號碼找
            if (TimesArray.length < set.amount) TimesArray.push(statics.filter(y => y.count == NowTimes--));
            //該出現次數的號碼不夠，就往下一個次數少的號碼找
            if (TimesArray.length < set.amount) TimesArray.push(statics.filter(y => y.count == NowTimes--));
            //亂數排序
            let RandomArray = TimesArray.sort((a,b)=>(0.5 - Math.random()));
    
            //某個排名的號碼組數，不足PickSet的數量會出錯
            for(let i = 0;i < set.amount;i++)  newNumber.push(RandomArray[i].no);
        }
    })
    //排序(小 > 大)
    return newNumber.sort((a,b)=>(parseInt(a) > parseInt(b)) ? 1 : (parseInt(a) < parseInt(b)) ? -1 : 0).join(',');
}