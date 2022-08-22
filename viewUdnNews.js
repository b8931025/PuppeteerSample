const { join } = require('path');
const puppeteer = require('puppeteer');
const utilityDatetime = require('./datetime.js');
const fs = require('fs');
const util = require('./Util.js');

(async ()=>{
    var dir = `${__dirname}\\log\\`;
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
    //排序
    allList = allList.sort((a,b)=>{
        if (a.title > b.title) return 1;
        if (a.title < b.title) return -1;
        return 0;
    })

    //存檔
    util.saveFile(fileName, JSON.stringify(allList).replace(/,{/g,",\n{"))

    //開啟檔案
    util.execCmd("explorer", [fileName]);
})()

