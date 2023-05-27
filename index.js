require('dotenv').config()
const cron = require('node-cron')
const axios = require('axios')
const fs = require('fs')

const getData = async () => {
    const url = 'https://orapiweb2.pttor.com/api/oilprice/LatestOilPrice'
    const { data } = await axios.get(url)
    const old_priceDate = fs.readFileSync('util/time.txt', 'utf-8')
    const priceDate = data.data.priceDate
    const priceData = data.data.priceData

    if (old_priceDate != priceDate) {
        fs.writeFileSync('util/time.txt', priceDate)
        const oil_price = []
        await priceData.forEach(x => {
            oil_price.push({
                name: x.nameTh,
                price: x.price
            })
        })
        postData(oil_price, priceDate)
    }

}

const postData = async (data, date) => {
    const url = 'https://notify-api.line.me/api/notify'
    const token = process.env.TOKEN
    const oil = []
    await data.forEach(x => {
        oil.push(`${x.price} | ${x.name}`)
    })
    const config = {
        method: 'POST',
        url: url,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: `message=${date.split('T')[0]}\n${oil.join('\n')}`
    }
    await axios(config).then(res => console.log(res.data)).catch(err => console.log(err))

}

cron.schedule('1-5 5 * * *', () => {
    getData()
})