import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { dbconnect } from './db/index.js';
import cookieParser from 'cookie-parser';
dotenv.config()

const app=express();
app.use(cors())
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
dbconnect()
const port= process.env.PORT || 5000

app.listen((port),()=>{
    console.log(`app is running on http://localhost:${port}`)
})