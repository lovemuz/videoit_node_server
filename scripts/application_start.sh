#!/bin/sh
sudo chmod -R 777 /home/ubuntu/videoit/node
cd /home/ubuntu/videoit/node
sudo npm install -g yarn
export NODE_OPTIONS="--max-old-space-size=4096"
yarn
yarn global add pm2
yarn add bcrypt
yarn start
