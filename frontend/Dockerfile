FROM node:25-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN npm install -g serve

EXPOSE 3500

CMD ["serve", "-s", "dist", "-l", "3500"]