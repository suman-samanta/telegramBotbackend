const mongoose =require("mongoose");

const AdminUserSchema=new mongoose.Schema({

    oauthId: {
        type: String,
        required: [true, "{PATH} is required"],
        unique:true
      },

    name: {
        type: String,
        required: [true, "{PATH} is required"],
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
   
    
    role:{
        type:String,
    }
    
},{timestamps:true})

module.exports=mongoose.model("AdminUser",AdminUserSchema);