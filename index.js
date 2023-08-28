const express = require('express')
const bodyParser = require('body-parser')
const puppeteer = require('puppeteer')

const PORT = process.env.PORT || 3000

const app = express()

app.use(bodyParser.json())

app.post('/circleci', async (req, res) => {
  // CircleCI webhook reference:
  // https://circleci.com/docs/webhooks-reference/
  // console.log('Received Webhook:', req.body);
  console.log('Received a webhook:')
  console.log('Branch: ', req.body["pipeline"]["vcs"]["branch"])
  console.log('Status: ', req.body["workflow"]["status"])
  // const circleciPath = `https://app.circleci.com/pipelines/${req.body["project"]["slug"]}/${req.body["pipeline"]["number"]}/workflows/${req.body["workflow"]["id"]}`
  const circleciPath = req.body["workflow"]["url"]
  console.log('Pipeline:', circleciPath)

  if(req.body["pipeline"]["vcs"]["branch"] == "master" && req.body["workflow"]["status"] == "failed") {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.GOOGLE_CHROME_BIN,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })

    try {
      console.log('Trigerring the rerun')
      const page = await browser.newPage()

      await page.setCookie({
        name: 'ring-session',
        value: process.env.RING_SESSION,
        domain: '.circleci.com',
      })

      await page.setViewport({
        width: 1920,
        height: 1080,
      })

      await page.goto(circleciPath)
      // TODO: Wait for the element to be clicked instead of a timeout
      await page.waitForTimeout(2000)
      await page.click('button[aria-label="More Actions"][title="More Actions"].css-gm0ygh')
      await page.waitForTimeout(2000)
      await page.click('button[aria-label="Rerun failed tests"]')
      await page.waitForTimeout(2000)
      res.status(200).send('OK')
    } catch (error) {
      console.log('SOMETHING GOES WRONG!', error)
      res.status(500).send('Something goes wrong');
    } finally {
      await browser.close()
    }
  } else {
    console.log('The requirement does not match')
    res.status(200).send('OK')
  }
})

app.get('/', (req, res) => {
  console.log('Received homepage:', req.body);
  res.status(200).send('receiving requests on /circleci')
})

app.listen(PORT, () => {
  console.log('Application listening on port', PORT);
})

