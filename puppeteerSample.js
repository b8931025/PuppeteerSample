const puppeteer = require('puppeteer');

async function scrapy(){
    url = 'https://tw.yahoo.com'
    url = 'https://udn.com/NEWS/main.html'

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    //抓圖
    await page.screenshot({ path: 'example.png' });
    //取得title
    const title = await page.title()
    const list = await page.$$("div[class='member-dropdown dropdown-box']")

    //取得innerText
    const elemText = await page.$eval("div[class='member-dropdown dropdown-box']", elem => elem.innerText)
    //取得多個element
    const list1 = await page.$$eval("a[class='focus-list'] > h4", el => { return el.map(input => input.innerText) })
    selector = "span[class='tab-link__title']"
    selector = "a[class='tab-link '] > span[class='tab-link__title']"
    const list2 = await page.$$eval(selector, el => {return el.map(input => input.innerText)})
    selector ="div[class='story-list__text'] > h3 > a"
    const list3 = await page.$$eval(selector, el => {return el.map(input => input.title)})
    const allList = list3.concat(list1.concat(list2)).filter(x => x != "" && x.length > 4)
    
    await browser.close();

    result = {
                title,
                allList,
            }

    console.log(result)    
}

scrapy();

/*
const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false
  });

page.goto(url[, options])：直接進入特定的連結頁面
page.$(selector)：選取特定元素，等同於 document.querySelector
page.$$(selector)：前者的複數型，等同於 document.querySelectorAll
page.$eval(selector, pageFunction[, ...args])：對於選取的元素進行特定行為，如取出元素的 HTML 屬性值。
page.$$eval(selector, pageFunction[, ...args])：前者的複數型
page.click(selector[, options])：點擊特定的元素
page.type(selector, text[, options])：在特定的元素上輸入文字內容，通常是 input 上輸入
page.select(selector, ...values)：在 select 元素上選取特定的值
page.waitForSelector(selector[, options])：等待頁面上的特定元素出現，在非同步的過程中很實用。  

取得body html
html = await page.$eval("body", elem => elem.innerHTML)

取得innerText
txt = await page.$eval(selector, elem => elem.innerText)

頁面抓圖
await element.screenshot({ path: path}); 

整頁抓圖
await page.screenshot({ path: path,fullPage: true});

元件抓圖
const element = await page.$('img.psn_img')
await element.screenshot({ path: path});

區塊抓圖
const logo = await page.$('#hplogo');              // declare a variable with an ElementHandle
const box = await logo.boundingBox();              // this method returns an array of geometric parameters of the element in pixels.
const x = box['x'];                                // coordinate x
const y = box['y'];                                // coordinate y
const w = box['width'];                            // area width
const h = box['height'];                           // area height
await page.screenshot({'path': 'logo.png', 'clip': {'x': x, 'y': y, 'width': w, 'height': h}});
*/