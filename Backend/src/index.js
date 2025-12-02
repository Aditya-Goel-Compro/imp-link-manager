import "dotenv/config.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 1111, () => {
        console.log(`backend running at ${process.env.PORT} : http://localhost:1111`)
    })
})
.catch((error) => {
    console.log(" \n error in DB connection " , error)
})
