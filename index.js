const express = require('express')
const bodyParser = require('body-parser')

const PORT = process.env.PORT || 3000

const app = express()

app.use(bodyParser.json())

app.post('/circleci', (req, res) => {
  // CircleCI webhook reference:
  // https://circleci.com/docs/webhooks-reference/
  console.log('Received Webhook:', req.body);
  if(req.body["pipeline"]["vcs"]["branch"] == "master" && req.body["workflow"]["status"] != "success") {
    const circleciPath = `https://app.circleci.com/pipelines/${req.body["project"]["slug"]}/${req.body["pipeline"]["number"]}/workflows/${req.body["workflow"]["id"]}`
    res.status(200).send('going to: ', circleciPath);
  } else {
    res.status(200).send('Dont go');
  }
})

app.get('/', (req, res) => {
  console.log('Received homepage:', req.body);
  res.status(200).send('receiving requests on /circleci')
})

app.listen(PORT, () => {
  console.log('Application listening on port', PORT);
})
