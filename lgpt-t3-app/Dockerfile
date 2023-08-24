FROM node:18

ARG APP_INTERNAL_PORT
ENV APP_INTERNAL_PORT=${APP_INTERNAL_PORT}

WORKDIR /usr/src/lgpt_app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
COPY ./docker.env ./.env

RUN npx next build

EXPOSE ${APP_INTERNAL_PORT}
CMD ["npm", "run", "start"]
