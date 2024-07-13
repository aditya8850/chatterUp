import mongoose from "mongoose"
export const connectDB = async()=>{
    try {
        await mongoose.connect('mongodb://localhost:27017/chatterUp');
        console.log("connected to DB");
    } catch (error) {
        console.log(error);
    }
}