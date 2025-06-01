import express from "express";
import router from "./routes"
import { createServer } from 'http';
import { setupWebSocket } from './websoket';
import { configDotenv } from "dotenv";
import cors from 'cors'
configDotenv();

const app = express();
app.use(cors({origin:"http://192.168.1.3:5173"}))
const server = createServer(app);

app.use(express.json());

app.use("/",router)
console.log(process.env.JWT_SECRET_KEY);


// Use WebSocket
setupWebSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));