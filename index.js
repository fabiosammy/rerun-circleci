const express = require('express')
const bodyParser = require('body-parser')
const puppeteer = require('puppeteer')

const PORT = process.env.PORT || 3000

const app = express()

app.use(bodyParser.json())

app.post('/circleci', async (req, res) => {
  // CircleCI webhook reference:
  // https://circleci.com/docs/webhooks-reference/
  console.log('Received Webhook:', req.body);
  // const circleciPath = `https://app.circleci.com/pipelines/${req.body["project"]["slug"]}/${req.body["pipeline"]["number"]}/workflows/${req.body["workflow"]["id"]}`
  const circleciPath = req.body["workflow"]["url"]
  console.log('Destination:', circleciPath)

  if(req.body["pipeline"]["vcs"]["branch"] == "master" && req.body["workflow"]["status"] != "success") {
    const browser = await puppeteer.launch()
    try {
      console.log('going to the destination')
      const page = await browser.newPage()
      await page.goto(circleciPath)
      await page.click('span:contains("Rerun")')
      await page.waitForTimeout(2000)
      await page.click('span:contains("Rerun failed tests")')
      await page.waitForTimeout(2000)
      res.status(200).send('going to: ', circleciPath)
    } catch (error) {
      console.log('SOMETHING GOES WRONG!!!')
      res.status(500).send('Something goes wrong');
    } finally {
      await browser.close()
    }
  } else {
    console.log('Dont go')
    res.status(200).send('Dont go')
  }
})

app.get('/', (req, res) => {
  console.log('Received homepage:', req.body);
  res.status(200).send('receiving requests on /circleci')
})

app.listen(PORT, () => {
  console.log('Application listening on port', PORT);
})
