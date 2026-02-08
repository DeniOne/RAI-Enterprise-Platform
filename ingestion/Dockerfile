FROM node:20-alpine

WORKDIR /app

COPY ingestion/package.json /app/ingestion/package.json
COPY ingestion/tsconfig.json /app/ingestion/tsconfig.json
COPY ingestion/src /app/ingestion/src
COPY contracts /app/contracts

RUN cd /app/ingestion && npm install && npm run build

WORKDIR /app/ingestion

ENV PORT=8080

CMD ["node", "dist/index.js"]
