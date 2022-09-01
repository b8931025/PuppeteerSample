const puppeteer = require('puppeteer');
const utilityDatetime = require('./datetime.js');
const util = require('./Util.js');
const fs = require('fs');
const pageAmount = 40;
const delayIntroPage = 3;
const delayMemberPage = 1;
const onlyOne = false;
const headless = true;

/*
    確認圖片完整
    抓所有會員 男女

    新進會員
    member_list.asp?t=1
    人氣會員
    member_list.asp?t=2
    配對
    member_list.asp?t=3

    運動習慣：--,走路与瑜伽 ??
    興趣取向：--,音樂、運動、旅遊 ??
*/

(async ()=>{
  var dir = `.\\log\\DateMeNow\\${utilityDatetime.yyyymmdd()}\\`
  if (!fs.existsSync(dir))fs.mkdirSync(dir);
  let checkCodeName = dir + "checkCode.png";
  let pathTmp = dir + "tmp.txt"
  let pathResult = dir + "result.json"
  //, args: ['--window-size=1920,1080'], 視窗大小
  //, defaultViewport: {width:1920,height:1080} 頁面大小
  //, headless: true 是否背景執行
  viewSize = null
  viewSize = {width:1920,height:1080}
  const browser = await puppeteer.launch({defaultViewport: viewSize, headless:headless});
  const page = await browser.newPage();

  //取得檢查碼圖片
  url = 'https://www.singleparty.com.tw/login.asp'
  await page.goto(url);
  await page.click("button.float-panel-box-close");

  //顯示驗證碼
  const element = await page.$('img.psn_img')
  await element.screenshot({ path: checkCodeName}); 
  util.execCmd("explorer", [checkCodeName]);
  
  //輸入驗證碼與帳密
  const prompt = require('prompt-sync')();
  let checkCode = prompt('Check Code:');
  let loginId = prompt('Login Id:');
  let loginPw = prompt('Login password:');  
  await page.type("#id", loginId)
  await page.type("#pd", loginPw)
  await page.type("#psn", checkCode)
  //按下登入鍵
  await page.click("button.btn.btn-lg.btn-block.btn-main.btn-3d.nomargin");
  util.sleep(delayMemberPage * 1000);

  //收集會員清單
  urlMember = 'https://www.singleparty.com.tw/member_list.asp'
  allMember = []
  console.log(`收集會員清單 ${utilityDatetime.yyyymmddhhmmss()}`)
  for(let i=0;i<pageAmount;i++){
    url = urlMember + `?topage=${i+1}`
    await page.goto(url)
    util.sleep(delayMemberPage * 1000);

    const list = await page.$$eval("a.profile", (el)=>{
        return el.map(x=>{
            let urlIntro = x.href
            let id = x.href.split("=")[1]
            let urlImg = x.querySelector("img").src
            let name = x.querySelector("div.photo-text").innerHTML.replace(/\n/g,'').replace(/\t/g,'')
            let city = name.split(" ")[0]
            let pageIndex = 0
            let avatarDownloadSuccess = true
            name = name.split(" ")[1]
            return {id,city,name,urlIntro,urlImg,pageIndex,avatarDownloadSuccess}
        })
    })

    if (list.length == 0) break
    list.forEach(x=>x.pageIndex=i)
    allMember = allMember.concat(list)
    if(onlyOne) break
  }
  
  //抓圖-個人介紹頁面
  let currentPageIndex = -1
  for(let i = 0;i<allMember.length;i++ ){
    let mem = allMember[i]
    mem.imgIntro = `${dir}${mem.id}_pg.png`
    mem.imgAvatar = `${dir}${mem.id}_0.png`

    //顯示當前抓取頁面
    if (currentPageIndex != mem.pageIndex){
      console.log(`scrapying page no. ${mem.pageIndex}`)
      currentPageIndex = mem.pageIndex
    }

    await page.goto(mem.urlIntro)

    //關閉浮動廣告
    try{
      await page.click("#mem_today")
      await page.click("#popup_line > div > div > div:nth-child(1) > button.close")
      await page.click("#lvup_modal > div > div > div:nth-child(1) > button.close")
    }catch(e){}
    //let xx = prompt('暫停:');

    //介紹
    mem.desc = await page.$eval("div.profile-introduce.col-md-12", elem => elem.innerText.replace("自我介紹\n",""))
    //年齡
    mem.age = await page.$eval("ul.list-unstyled.line-height-25:nth-child(1) > li:nth-child(3)", elem => elem.innerText.replace("年齡：","").replace(" 歲",""))
    //身高
    mem.height = await page.$eval("ul.list-unstyled.line-height-25:nth-child(1) > li:nth-child(4)", elem => elem.innerText.replace("身高：","").replace(" cm",""))    
    //頭髮顏色
    mem.color = await page.$eval("ul.list-unstyled.line-height-25.margin-bottom-0 > li:nth-child(1) > span", elem => elem.innerText)
    //興趣取向 ??
    mem.favorite = await page.$eval("ul.list-unstyled.line-height-25.margin-bottom-0 > li:nth-child(2) > span", elem => elem.innerText)
    //運動習慣 ??
    mem.sport = await page.$eval("ul.list-unstyled.line-height-25.margin-bottom-0 > li:nth-child(9) > span", elem => elem.innerText)
    //聯絡方式
    mem.contact = await page.$eval("div.toggle:nth-child(2) > div > div:nth-child(2) > ul > li:nth-child(2) > span", elem => elem.innerText)
    //公司別
    mem.company = await page.$eval("div.toggle.active > div > div:nth-child(1) > ul > li:nth-child(1) > span", elem => elem.innerText)
    //會員等級
    mem.level = await page.$eval("#wrapper > section:nth-child(3) > div > div.col-md-4.margin-bottom-20 > div:nth-child(1)", elem => elem.className)
    
    //展開區塊
    await page.click("div.toggle:nth-child(2)")
    page.waitForSelector("div.toggle:nth-child(2)")
    //展開區塊
    await page.click("div.toggle:nth-child(3)")    
    page.waitForSelector("div.toggle:nth-child(3)")
    //頁面截圖
    await page.screenshot({ path: mem.imgIntro , fullPage: true });
    
    if(onlyOne) break
  }
  util.saveFile(pathResult, JSON.stringify(allMember).replace(/,{/g,"\n,{"))

  //下載個人照
  console.log(`下載個人照 ${utilityDatetime.yyyymmddhhmmss()}`)
  for(let i = 0;i<allMember.length;i++ ){
    let mem = allMember[i]
    try{
      await util.downloadImage(mem.urlImg,mem.imgAvatar)
    }catch(e){
      mem.avatarDownloadSuccess = false
    }
    if(onlyOne) break
  }

  //欄位重新排序
  allMember = allMember.map(x => {
    let pageIndex = x.pageIndex
    let id = x.id
    let city = x.city
    let name = x.name
    let age = x.age
    let height = x.height
    let color = x.color
    let level = x.level
    let company = x.company
    let favorite = x.favorite
    let sport = x.sport
    let contact = x.contact
    let desc = x.desc
    let urlIntro = x.urlIntro
    let urlImg = x.urlImg
    let imgIntro = x.imgIntro
    let imgAvatar = x.imgAvatar
    let avatarDownloadSuccess  = x.avatarDownloadSuccess 
    
    return { pageIndex, id, city, name, age, height, level, company, color, favorite, sport, contact, desc, urlIntro, urlImg, imgIntro, imgAvatar, avatarDownloadSuccess }
  })

  //util.saveFile(pathTmp, await page.$eval("body", elem => elem.innerHTML))    //存下html
  //console.log(allMember)
  util.saveFile(pathResult, JSON.stringify(allMember).replace(/,{/g,"\n,{"))
  console.log(`download ok ${utilityDatetime.yyyymmddhhmmss()}`)
  await browser.close();
})()