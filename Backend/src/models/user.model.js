  const mongoose =require("mongoose")


  const userSchema =  new mongoose.Schema({
username:{
    type:String,
    unique:[true," username already taken "],
    require:true
},
email:{
    type:String,
    unique:[true," account already  exist with this email address "],
    require:true,
},
password:{
    type:String,
    require:true
}

  }) 
   const userModel = mongoose.model("user", userSchema)
   module.exports =userModel;
   