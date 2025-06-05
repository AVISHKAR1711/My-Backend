
import dotenv from "dotenv";
dotenv.config({ path: './env' });

import mongoose from "mongoose";

import connectDB from "./db/index.js";

connectDB()
.then(()=> {
    app.listen(process.env.PORT || 8500,() => {
        console.log(`Server is running at port :${process.env,PORT}`);
    })

    app.on((error)  => {
        console.log('server failed to start' , error);
    })
})
.catch((error) =>{
    console.log("MongoDB connection failed", error);
} )