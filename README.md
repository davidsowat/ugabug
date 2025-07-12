# ugabug
# Spotify Kurator

This project contains a React interface styled with Tailwind CSS and an Express backend that generates playlist recommendations using the OpenAI API.

## Running the app

1. Install dependencies:
   ```bash
   cd kurator
   npm install
   ```
   Node.js 18 or later is recommended.
2. Build the React frontend:
   ```bash
   npm run build
   ```
3. Start the server:
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`.

Start the server from the `kurator` folder so that static files are served
correctly regardless of your current working directory.

During development you can run `npm run dev` to use Vite's hot reloading server.
