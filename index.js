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
  const pipelinePath = `https://app.circleci.com/pipelines/${req.body["project"]["slug"]}/${req.body["pipeline"]["number"]}`
  const workflowPath = req.body["workflow"]["url"]
  console.log('Pipeline:', pipelinePath)
  console.log('Workflow:', workflowPath)

  if(req.body["pipeline"]["vcs"]["branch"] == "master" && req.body["workflow"]["status"] == "failed") {
    console.log('For debug, all the webhook data: ', req.body)
    console.log('####################')
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.GOOGLE_CHROME_BIN,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })

    try {
      console.log('Trigerring the rerun...')
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

      await page.goto(pipelinePath)

      // TODO: Wait for the element to be clicked instead of a timeout
      await page.waitForTimeout(2000)

      // TODO: Ignore if something is running
      // <a data-cy="workflow-status-link" href="/pipelines/github/clickfunnels2/admin/82679/workflows/f8cc9c2e-8c95-4d33-9376-8174e27eceec" class="css-l59eie">
      //  <div title="Running" type="RUNNING" class="css-14act6w">
      //    <div color="currentColor" class="css-f9197o" data-darkreader-inline-color="" style="--darkreader-inline-color: currentColor;">
      //       <svg role="img" focusable="false" viewBox="0 0 24 24" aria-label="Status Running Dark" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="css-bleycz" data-darkreader-inline-fill="" style="--darkreader-inline-fill: currentColor;">
      //         <circle fill="#6A6A6A" cx="12" cy="12" r="10" data-darkreader-inline-fill="" style="--darkreader-inline-fill: #a59d92;">
      //         </circle>
      //         <path fill="#FFFFFF" stroke="#FFFFFF" d="M22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12" class="css-wt8bno" data-darkreader-inline-fill="" data-darkreader-inline-stroke="" style="--darkreader-inline-fill: #e8e6e3; --darkreader-inline-stroke: #e8e6e3;">
      //         </path>
      //         <path fill="#FFFFFF" stroke="#FFFFFF" d="M22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12" class="css-ucdh5z" data-darkreader-inline-fill="" data-darkreader-inline-stroke="" style="--darkreader-inline-fill: #e8e6e3; --darkreader-inline-stroke: #e8e6e3;">
      //         </path>
      //       </svg>
      //     </div>
      //     Running
      //   </div>
      //   <div class="css-1xczg1a">9m 38s&nbsp;
      //     <div class="css-2va2ht">
      //       remain
      //       <span data-tip="Estimated time remaining based on previous workflow runs." data-for="pipeline-action-tooltip" data-place="bottom" currentitem="false">
      //         <div size="16" color="currentColor" class="css-gq48mf" data-darkreader-inline-color="" style="--darkreader-inline-color: currentColor;">
      //           <svg role="img" focusable="false" viewBox="0 0 24 24" aria-label="Info Outline" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="css-bleycz" data-darkreader-inline-fill="" style="--darkreader-inline-fill: currentColor;">
      //             <path fill-rule="evenodd" clip-rule="evenodd" d="M20 12C20 7.58457 16.4154 4 12 4C7.58457 4 4 7.58457 4 12C4 16.4154 7.58457 20 12 20C16.4154 20 20 16.4154 20 12ZM22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12ZM12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6ZM11 11C11 10.4477 11.4477 10 12 10C12.5523 10 13 10.4477 13 11V17C13 17.5523 12.5523 18 12 18C11.4477 18 11 17.5523 11 17V11Z">
      //             </path>
      //           </svg>
      //         </div>
      //       </span>
      //     </div>
      //   </div>
      // </a>

      // Count the number of elements inside of a page
      const counter_all_tests = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'))
        return anchors.filter(anchor => anchor.textContent.trim() === 'all_tests').length
      })

      // Because of the duplication of the webhooks, is doing two more than the counter below
      if(counter_all_tests < 5) {
        console.log(`Rerunning ${req.body["pipeline"]["vcs"]["branch"]} after ${counter_all_tests} tries!`)
        await page.goto(workflowPath)
        await page.waitForTimeout(2000)
        await page.click('button[aria-label="More Actions"][title="More Actions"]')
        await page.waitForTimeout(2000)
        await page.click('button[aria-label="Rerun failed tests"][title="Rerun failed tests"]')
        await page.waitForTimeout(2000)
      } else {
        console.log(`Ignored after ${counter_all_tests} tries!`)
      }
    } catch (error) {
      console.log('SOMETHING GOES WRONG!', error)
      res.status(500).send('Something goes wrong');
    } finally {
      await browser.close()

      res.status(200).send('OK')
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
  const circleEndpoint = `https://circleci.com/api/v2/project/github/${project}/pipeline`
  const circleRedirect = `https://app.circleci.com/pipelines/github/${project}?branch=${branch}`

  console.log(`Running the ci for branch ${branch} on ${project} project to ${circleEndpoint}`)
  console.log(`Should return to ${referrer} or ${circleRedirect}`)
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Circle-Token': process.env.CIRCLE_TOKEN},
    body: JSON.stringify({
      branch: branch
    }),
  }

  fetch(circleEndpoint, options)
    .then(response => response.json())
    .then(data => console.log('CircleCI API response:', data))
    .catch(error => console.error('Error sending POST request to CircleCI API:', error))

  res.redirect(circleRedirect)
})

app.get('/', (req, res) => {
  console.log('Received homepage:', req.body);
  res.status(200).send('receiving requests on /circleci')
})

app.listen(PORT, () => {
  console.log('Application listening on port', PORT);
})

