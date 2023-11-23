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
    console.log('For debug, all the webhook data: ', req.body)
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
      await page.click('button[aria-label="More Actions"][title="More Actions"]')
      await page.waitForTimeout(2000)
      await page.click('button[aria-label="Rerun failed tests"][title="Rerun failed tests"]')
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

app.get('/run-ci', async(req, res) => {
  const referrer = req.headers["referer"]
  const project = req.query.project
  const branch = req.query.branch

  console.log(`"Running the ci for branch ${branch} on ${project} project"`)
  const options = {
    method: 'POST',
    url: `https://circleci.com/api/v2/project/gh/${project}/pipeline`,
    headers: {'content-type': 'application/json', authorization: `Circle-Token ${process.env.CIRCLE_TOKEN}`},
    body: JSON.stringify({
      branch: branch,
      parameters: {'run-ci': true}
    }),
  }

  fetch(options)
    .then(response => response.json())
    .then(data => console.log('CircleCI API response:', data))
    .catch(error => console.error('Error sending POST request to CircleCI API:', error))

  if (referrer) {
    res.redirect(referrer);
  } else {
    res.redirect(`"https://app.circleci.com/pipelines/github/${project}?branch=${branch}"`);
  }
})

app.get('/', (req, res) => {
  console.log('Received homepage:', req.body);
  res.status(200).send('receiving requests on /circleci')
})

app.listen(PORT, () => {
  console.log('Application listening on port', PORT);
})

