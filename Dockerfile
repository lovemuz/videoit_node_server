FROM node:16

WORKDIR /app/itgo/itgo-server-v1

COPY package.json .

RUN yarn

COPY tsconfig.json .

COPY src/ src/

RUN yarn run build

