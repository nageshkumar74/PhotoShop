
import mongoose from "mongoose";

const MONGODB_URL=process.env.MONGODB_URL;

if(!MONGODB_URL){
    throw new Error("Check your connection string");
}

let cached=global.mongoose;


if(!cached){
    cached=global.mongoose={conn:null,promise:null}
}
// MONGODB_URL
export async function connectToDatabase(){

    console.log("Connecting to:",process.env.MONGODB_URL);
    const uri: string = process.env.MONGODB_URL!;

    if(cached.conn){
        return cached.conn;
    }
    if(!cached.promise){
        const opts={
            bufferCommands:true,
            maxPoolSize:10,
        };
        cached.promise=mongoose.connect(uri,opts).then(()=>mongoose.connection);
    }
    try{
        cached.conn=await cached.promise;
    }

    catch(error){
          cached.promise=null;
          throw error;
    }
    return cached.conn;
}