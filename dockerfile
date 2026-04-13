FROM node:25-slim

RUN apt update && npm install -g npm@latest

RUN apt install -y chromium ffmpeg

WORKDIR /application

COPY package.json package-lock.json ./
RUN npm install

COPY converter.js ./
RUN chmod +x converter.js

WORKDIR /data

ENTRYPOINT ["/application/converter.js"]
