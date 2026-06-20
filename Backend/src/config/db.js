const  mongoose = require("mongoose");


async function connectDB() {
    try{
    mongoose.connect(process.env.MONGO_URI)
    console.log("connect to database ")

    }
catch(err){
    console.log(err)
}
    
}
module.exports  = connectDB;