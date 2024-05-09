FROM node:22-alpine
RUN mkdir -p /home/node/app/node_modules && mkdir -p /home/node/app/storage && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install
COPY --chown=node:node index.js .
EXPOSE 25
CMD [ "npm", "run", "start"]
