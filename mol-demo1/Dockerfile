FROM node:12-alpine

RUN mkdir /app &&\
    apk --no-cache add git python
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build && npm prune --production

ENV NODE_ENV=production
CMD ["npm", "start"]