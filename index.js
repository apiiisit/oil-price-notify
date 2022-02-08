const puppeteer = require('puppeteer')
const axios = require('axios')
const fs = require('fs')
const cron = require('node-cron')

async function getOil() {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()

    await page.goto('https://www.pttor.com/th/oil_price_board')
    const element_time = await page.waitForSelector('#__layout > div > div > div > div.obox-subhead')
    const cTimetext = await page.evaluate(element => element.textContent, element_time)
    const cTime = cTimetext.split('\n')[4].trim()
    const time = fs.readFileSync('time.txt', 'utf8')

    const oil_name = ['ดีเซล B7 Premium', 'ดีเซล B7', 'ดีเซล', 'ดีเซล B20', 'เบนซิน', 'G95', 'G91', 'E20', 'E85', 'NGV']
    const oil_price = []
    if (time != cTime) {
        fs.writeFileSync('time.txt', cTime)
        for (let i = 3; i < 13; i++) {
            const element_price = await page.waitForSelector(`#__layout > div > div > div > div:nth-child(${i}) > div > div > div.oil-price`)
            const priceText = await page.evaluate(element => element.textContent, element_price)
            oil_price[i - 3] = `${priceText.trim()} : ${oil_name[i - 3]}`
        }
        browser.close()
        return oil_price

    }
    browser.close()
}

async function sendMsg() {
    const url = 'https://notify-api.line.me/api/notify'
    const token = ''
    const oil_price = await getOil()
    if (oil_price) {
        const oil = oil_price.join('\n')
        const config = {
            method: 'POST',
            url: url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: `message=\n${oil}`
        }
        await axios(config).then(res => console.log(res.data, '\n' + oil)).catch(err => console.log(err))
    }
}

cron.schedule('2,4,6,8,10 5 * * *', () => {
    sendMsg()
})