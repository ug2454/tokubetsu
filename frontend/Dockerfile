FROM node:20-alpine

WORKDIR /app

# Install Python and build dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install -g npm@latest && \
    npm install && \
    npm install --save-dev @types/node vite @vitejs/plugin-react && \
    npm install axe-core @types/axe-core

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"] 