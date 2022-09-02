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
    await page.goto(url);
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

        txt = JSON.stringify(allLink).replace(/,{/g,",\n{") + '\n\n<<html>>\n\n' + (await page.$eval("body", elem => elem.innerHTML))
    }    

    browser.close()

    //存檔
    util.saveFile(pathHtml, `<<${title}>>\n\n${txt}`)

    //開啟檔案
    util.execCmd("explorer", [pathHtml]);
})()
