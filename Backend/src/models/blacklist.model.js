const mongoose = require('mongoose')

 const blacklistTokenSchema = new mongoose.Schema({

    toekn:{
        type:String,
        require:[true,"token is require to be added in  blacklist"]
    }
 },{
    timestamps:true
 })

 const  tokenBlacklistModel =  mongoose.model("blacklistToken",blacklistTokenSchema)
 module.exports = tokenBlacklistModel