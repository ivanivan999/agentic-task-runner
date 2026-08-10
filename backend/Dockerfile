FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace agentic-task-runner-backend
COPY backend ./backend
WORKDIR /app/backend
EXPOSE 3001
CMD ["npm", "run", "start"]
