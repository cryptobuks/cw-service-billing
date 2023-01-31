FROM node:14.7.0-alpine3.12
ARG token
RUN npm install -g rimraf

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .
RUN rimraf node_modules
RUN npm config set @cowellness:registry https://gitlab.com/api/v4/packages/npm/
RUN npm config set '//gitlab.com/api/v4/packages/npm/:_authToken' "$token"
RUN npm config set '//gitlab.com/api/v4/projects/20768331/packages/npm/:_authToken' "$token"
RUN export NODE_ENV=production
RUN mv config/production.js.template config/production.js
RUN npm install

EXPOSE 3010

CMD [ "npm","start"]
