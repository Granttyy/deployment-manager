# Use a lightweight Node image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your app code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run the app
CMD [ "node", "server/app.js" ]