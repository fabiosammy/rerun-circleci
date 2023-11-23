# Current Image:
# https://github.com/CircleCI-Public/cimg-ruby/blob/052c360fc8a34783fed4809cd0388d6d61a30494/2.7/browsers/Dockerfile
FROM cimg/node:18.18.2-browsers

ENV CHROME_VERSION 114.0.5735.90

# DO NOT PUT MORE THAN 1 RUN - LAYER CACHING STUFF
RUN sudo apt-get update \
    && wget --no-verbose -O /tmp/chrome.deb "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb" \
    && sudo apt-get install -y /tmp/chrome.deb \
    && rm /tmp/chrome.deb \
    && wget --no-verbose -O /tmp/chromedriver_linux64.zip "https://chromedriver.storage.googleapis.com/${CHROME_VERSION}/chromedriver_linux64.zip" \
    && sudo unzip /tmp/chromedriver_linux64.zip -d /usr/local/bin \
    && rm /tmp/chromedriver_linux64.zip \
    && sudo apt-get clean \
    && sudo rm -rf /var/lib/apt/lists/*

WORKDIR /var/app
