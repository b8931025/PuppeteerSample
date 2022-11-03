const { join } = require('path');
const puppeteer = require('puppeteer');
const utilityDatetime = require('./datetime.js');
const fs = require('fs');
const util = require('./Util.js');
const pageSize = 20;

//暫停
const pause = async () => {
    console.log('<<按任意鍵下一頁>>')
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
    }))
  }

//下載新聞清單
const downloadNews = async(dir)=>{
    var now = utilityDatetime.yyyymmddhhmmss();
    if (!fs.existsSync(dir))fs.mkdirSync(dir);
    let imgName = dir + now + ".png";
    let fileName = dir + now + ".txt";
    let pathHtml = dir + "html.txt";

    //, args: ['--window-size=1920,1080'], 視窗大小
    //, defaultViewport: {width:1920,height:1080} 頁面大小
    //, headless: true 是否背景執行
    viewSize = {width:1920,height:1080}
    viewSize = null
    const browser = await puppeteer.launch({defaultViewport: viewSize});
    const page = await browser.newPage();
    let allList = []
    let subList = []
    let hrefList = []
    let tmpList = []

    console.log('下載中...')

    //首頁
    url = 'https://udn.com/NEWS/main.html'
    await page.goto(url);

    //逐步移動捲軸，等所有圖片載入 , ps:page.goto的{waitUntil : "networkidle2"} 無用
    var obj = {delay:100,steps:60}
    for(step = 1;step <= obj.steps;step++){
        await page.evaluate((steps,step) => {
            return Promise.resolve(window.scrollTo(0,(document.body.scrollHeight*step)/steps));
        },obj.steps,step);
        //delay
        var start = (new Date().getTime()) + obj.delay;
        while (new Date().getTime() < start);          
    }

    //抓取全螢幕畫面
    await page.screenshot({ path: imgName,fullPage: true });

    selector = "a[class='focus-list'] > h4"
    subList = await page.$$eval(selector, el => { return el.map(input => input.innerText) })
    selector = "a[class='focus-list']"
    hrefList = await page.$$eval(selector, el => { return el.map(input => input.href) })
    for(i = 0;i < subList.length; i++) allList.push({title:subList[i],url:hrefList[i]})

    selector = "a[class='tab-link '] > span[class='tab-link__title']"
    subList = await page.$$eval(selector, el => {return el.map(input => input.innerText)})
    selector = "a[class='tab-link ']"
    hrefList = await page.$$eval(selector, el => { return el.map(input => input.href) })
    for(i = 0;i < subList.length; i++) allList.push({title:subList[i],url:hrefList[i]})
    
    selector ="div[class='story-list__text'] > h3 > a"
    subList = await page.$$eval(selector, el => {return el.map(input => {return {title: input.title, url: input.href}})})
    allList = allList.concat(subList)

    //全球
    url = 'https://udn.com/news/cate/2/7225'
    await page.goto(url);
    selector = "a[data-story_list='list_全球']"   
    subList = await page.$$eval(selector, el => {return el.map(input => {
        let title = input.title ? input.title : input.getAttribute("aria-label")
        return {title: title, url: input.href}
    })})
    allList = allList.concat(subList)

    //要聞
    url = 'https://udn.com/news/cate/2/6638'
    await page.goto(url);
    selector = "a[data-story_list='list_要聞']"   
    subList = await page.$$eval(selector, el => {return el.map(input => {
        let title = input.title ? input.title : input.getAttribute("aria-label")
        return {title: title, url: input.href}
    })})
    allList = allList.concat(subList)

    //社會
    url = 'https://udn.com/news/cate/2/6639'
    await page.goto(url);
    selector = "a[data-story_list='list_社會']"
    subList = await page.$$eval(selector, el => {return el.map(input => {
        let title = input.title ? input.title : input.getAttribute("aria-label")
        return {title: title, url: input.href}
    })})
    allList = allList.concat(subList)
    
    await browser.close();

    //空字串、字數小於4、重複的都排除
    allList = allList.filter((value, index, self) => value.title && value.title.length > 4 && self.map(x=>x.title).indexOf(value.title) === index)
    //排序 by title
    allList = allList.sort((a,b)=>{
        if (a.title > b.title) return 1;
        if (a.title < b.title) return -1;
        return 0;
    })
    allList = allList.map((val,idx)=>{return {no:(idx+1),title:val.title,url:val.url}})

    //存檔
    util.saveFile(fileName, JSON.stringify(allList).replace(/,{/g,",\n{"))

    //開啟檔案
    //util.execCmd("explorer", [fileName]);

    //listing
    for(let i = 0; i < allList.length; i++){
        const element = allList[i]
        console.log(element.no,element.title,element.url)
        if (((i+1) % pageSize) == 0){
            await pause();
        }
    }
    process.exit();
}

//取得最新清單
const getNewsData = async(dir)=>{
    let txtList = await fs.readdirSync(dir);
    let fileName = txtList.filter(x => x.startsWith('202') && x.indexOf('.txt') > -1).sort().pop()
    if (!fileName) throw '尚未下載新聞清單'

    fileName = `${dir}/${fileName}`
    let content = await fs.readFileSync(`${fileName}`,{encoding:"utf-8"})
    let newsData = JSON.parse(content);
    return newsData;
}

//列出清單
const showList = async(dir)=>{
    const newsData = await getNewsData(dir);
    for(let i = 0; i < newsData.length; i++){
        const element = newsData[i]
        console.log(element.no,element.title,element.url)
        if (((i+1) % pageSize) == 0 && (i+1) != newsData.length){
            await pause();
        }
    }
    process.exit();
}

//讀取新聞
const readNews = async(dir,newsNo)=>{
    const newsData = await getNewsData(dir);
    let news = newsData.filter(x => x.no == newsNo)
    if (news && news.length > 0){
        let url = news[0].url
        console.log('讀取中...')
        util.execCmd("node", ['./getWebsite.js',url]);
    }
}

(async ()=>{
    let logPath = 'log';
    let dir = `${__dirname}\\${logPath}\\`;
    console.clear()

    try{
        //是否有加參數
        if (process.argv.length <= 2) {
            throw '--download 下載新聞\n--list 列出清單\n--read NO 讀取新聞'
        }
        
        let optionCount = 0
        //--list 列出新聞清單
        const idxList = process.argv.indexOf("--list");
        if (idxList > -1)optionCount++

        //--read No 顯示新聞內容
        const idxRead = process.argv.indexOf("--read");
        if (process.argv.length < (idxRead + 2)) throw "optional is not enough"
        const newsNo = (idxRead > -1) ? process.argv[idxRead + 1] : ""
        if (idxRead > -1)optionCount++

        //--download 下載新聞
        const idxDownload = process.argv.indexOf("--download");
        if (idxDownload > -1)optionCount++

        if (optionCount > 1) throw "optional syntax is not valid";

        if (idxDownload > -1){
            await downloadNews(dir);
            await showList(dir);
        }else if(idxList > -1){
            showList(dir);
        }else if(idxRead > -1){
            readNews(dir,newsNo);
        }
    }catch(e){
        console.log(e)
    }
})()