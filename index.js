const { join } = require('path');
const puppeteer = require('puppeteer');
const utilityDatetime = require('./datetime.js');
const fs = require('fs');
const util = require('./Util.js');

(async ()=>{
    let txt = 'haha 123 33 567 9999'
    let replaceFunc = (match, idx, oldValue) => `[${match}]`;
    let result = txt.replace(/\d{3,4}/g,replaceFunc)
    console.log(result)
    /*
    
    */
})()

