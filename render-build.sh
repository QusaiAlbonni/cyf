#!/bin/bash

set -e

npm install -g ts-node
npm install -g pm2
npm install --production=false
npm run migration:run
npm run build
