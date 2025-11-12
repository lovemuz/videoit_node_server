#!/bin/sh
sudo apt-get update -y
curl -s https://deb.nodesource.com/setup_18.x | sudo bash
sudo apt install nodejs -y
sudo apt-get install build-essential -y

