# Rerun circle CI

This is just a pet project to we able to rerun the failed tests on circle ci.
Today, the circle CI API just allow us to rerun the failed JOB, the entire job.
So, this this approach, we can rerun just the failed tests.

## How can we use?

Well, you can simple deploy to heroku using the "puppeteer-heroku-buildpack" by "jontewks".

Also, the application, today, does no handle with the authentication.
To access a private project on the CircleCI, you need to copy the "ring-session" cookie from your browser.
The cookie should be save in the "RING_SESSION" env on heroku.

```sh
$ heroku create
$ heroku buildpacks:add jontewks/puppeteer
$ heroku config:set RING_SESSION=<cookie-data>
$ git push heroku master
```

And then go to the project settings, add a webhook to trigger when a complete workflow is done, and the link should be:
<domain>/circleci

The `/circleci` path will receive the webhook payload, and if is not a success, and the branch is master, it will run the google chrome using the puppeteer to interact with the CircleCI interface.

## How to reproduce?

You can run the project at yous localhost using docker/docker compose.
After installing both tools, do:

```sh
$ cp .env.sample .env # set the RING_SESSION copying from your own session on CircleCI
$ docker compose build app
$ docker compose run --rm app sudo PUPPETEER_SKIP_DOWNLOAD=true npm ci
$ docker compose up
```

And then you can access the application on `http://localhost:3000`

I suggest to use some kind of tunnel to add the local application on the CircleCI, for example, ngrok.


## Work to be done

[] Be able to check any branch by config
[] Wait for elements instead of using timeout
[] Treat the errors properly
[] Notification when some error occurs
[] Login integration
[] Check the webhook secret
[] A way to debug the requests recording the session or taking screenshots
