FROM node:12.18.2

WORKDIR /src/app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

CMD [ "node", "app.js" ]

