import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        let connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       console.log(`Connected to host , DB HOST: ${connectionInstance.connection.host}`);
       console.log(`and the Database name :- ${DB_NAME}`);


    } catch (error) {
        console.log("error in DB connection :- ", error)
        process.exit(1) ; 
    }
}



export default connectDB ; 