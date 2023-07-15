FROM node:16
WORKDIR /app
COPY . /app
RUN npm i
RUN npm run build
EXPOSE $PORT
CMD ["npm", "start"]
