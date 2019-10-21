FROM node:alpine
COPY package.json /opt/app/package.json
COPY package-lock.json /opt/app/package-lock.json
WORKDIR /opt/app
RUN npm i --production
EXPOSE 3000
ENV NODE_ENV production
COPY . /opt/app
ENTRYPOINT ["npm", "start"]
