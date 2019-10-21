FROM node:12-alpine AS BUILDER

RUN apk add ca-certificates python build-base
WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build:all && rm -rf node_modules && yarn install --prod

FROM node:12-alpine
RUN apk --no-cache add ca-certificates
COPY --from=builder /home/node/app /home/node/app
WORKDIR /home/node/app
EXPOSE 3000
ENTRYPOINT [ "node", "index.js" ]
STOPSIGNAL SIGINT
