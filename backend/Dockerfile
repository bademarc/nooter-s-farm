FROM node:20-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --production && npm cache clean --force
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1
