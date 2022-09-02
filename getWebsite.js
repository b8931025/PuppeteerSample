const puppeteer = require('puppeteer');
const fs = require('fs');
const util = require('./Util.js');

(async ()=>{
    var dir = `${__dirname}\\log\\`;
    if (!fs.existsSync(dir))fs.mkdirSync(dir);
    let pathHtml = dir + "html.txt";

    //get url from command line argument
    const args = process.argv.slice(2)
    if (args.length == 0) return 
    let url = args[0]

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    try{
        await page.goto(url);
    }catch(e){
        browser.close()
        console.log(`發生連線錯誤:${e.originalMessage}`)
        return
    }

    let title = await page.title()

    //html = await page.$eval("body", elem => elem.innerHTML)
    try{
        title = await page.$eval("body > main > div > section.wrapper-left.main-content__wrapper > section > h1", elem => elem.innerText)
        txt = await page.$eval("body > main > div > section.wrapper-left.main-content__wrapper > section > article > div", elem => elem.innerText)
    }catch(e){
        //該頁格式不符，產生錯誤，直接輸出完整html和超連結清單
        console.log(e)

        allLink = await page.$$eval('a', (el) => {return el.map(input => {
            let title = input.title ? input.title : input.getAttribute("aria-label") ? input.getAttribute("aria-label") : input.innerText.replace(/\n/g,'').replace(/^\s+|\s+$/g, '')
            return {title: title, url: input.href}
        })})

        //空字串、字數小於4、重複的都排除
        allLink = allLink.filter((value, index, self) => value.title != "" && value.title.length > 4 && self.map(x=>x.title).indexOf(value.title) === index)
        //排序 by title
        allLink = allLink.sort((a,b)=>{
            if (a.title > b.title) return 1;
            if (a.title < b.title) return -1;
            return 0;
        })

        txt = JSON.stringify(allLink).replace(/,{/g,",\n{")

        allText = (await page.$eval("body", elem => elem.innerText))

        txt += '\n\n<<html>>\n\n' + allText
    }

    browser.close()

    result = `<<${title}>>\n\n${txt}`
    //console.log(result)

    //存檔
    util.saveFile(pathHtml, result)

    //開啟檔案
    util.execCmd("explorer", [pathHtml]);
})()
