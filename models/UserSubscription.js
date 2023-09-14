const mongoose=require("mongoose");

const UserSubscriptionSchema={
    chatId:{
        type:Number,
        required:true,
        unique:true
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String
        
    },
    authorised:{
        type:Boolean,
        required:true,
        default:false
    }
}

module.exports=mongoose.model("UserSubscription",UserSubscriptionSchema);