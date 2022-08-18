const { join } = require('path');
const puppeteer = require('puppeteer');
const utilityDatetime = require('./datetime.js');
const fs = require('fs');

(async ()=>{
    var dir = './log/';
    var now = utilityDatetime.yyyymmddhhmmss();
    if (!fs.existsSync(dir))fs.mkdirSync(dir);
    let imgName = dir + now + ".png";
    let fileName = dir + now + ".txt";

    //, args: ['--window-size=1920,1080'], 視窗大小
    //, defaultViewport: {width:1920,height:1080} 頁面大小
    //, headless: true 是否背景執行
    viewSize = {width:1920,height:1080}
    viewSize = null
    const browser = await puppeteer.launch({defaultViewport: viewSize});
    const page = await browser.newPage();
    let allList = []
    let tmpList = []

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
    tmpList = await page.$$eval(selector, el => { return el.map(input => input.innerText) })
    allList = allList.concat(tmpList)

    selector = "a[class='tab-link '] > span[class='tab-link__title']"
    tmpList = await page.$$eval(selector, el => {return el.map(input => input.innerText)})
    allList = allList.concat(tmpList)
    
    selector ="div[class='story-list__text'] > h3 > a"
    tmpList = await page.$$eval(selector, el => {return el.map(input => input.title)})
    allList = allList.concat(tmpList)

    //全球
    url = 'https://udn.com/news/cate/2/7225'
    await page.goto(url);
    selector = "a[data-story_list='list_全球']"   
    tmpList = await page.$$eval(selector, el => {return el.map(input => input.title)})
    allList = allList.concat(tmpList)

    //要聞
    url = 'https://udn.com/news/cate/2/6638'
    await page.goto(url);
    selector = "a[data-story_list='list_要聞']"   
    tmpList = await page.$$eval(selector, el => {return el.map(input => input.title)})
    allList = allList.concat(tmpList)

    //社會
    url = 'https://udn.com/news/cate/2/6639'
    await page.goto(url);
    selector = "a[data-story_list='list_社會']"
    tmpList = await page.$$eval(selector, el => {return el.map(input => input.title)})
    allList = allList.concat(tmpList)

    //空字串、字數小於4、重複的都排除
    allList = allList.filter((value, index, self) => value != "" && value.length > 4 && self.indexOf(value) === index)
    allList = allList.sort()

    await browser.close();
    
    //存檔
    fs.writeFile(fileName, allList.join("\n"), 
        function (err) {
        if (err) return console.log(err);
        });

    /*
    //output console
    for(i = 0 ; i < allList.length; i+=20  ){
        for(j = i; j < (i+20) ; j++){
            if (j < allList.length) {
                console.log(allList[j]);
            }
        }
        sleep(1000*5);
    }   
    */
})()

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}
 

