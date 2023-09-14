const express=require("express");
const UserSubscription = require("../models/UserSubscription");
const router=express.Router();

const passport=require("passport");
const CLIENT_URL="https://chatbotadminpanel.netlify.app";
// const CLIENT_URL_HOME="http://localhost:3000/home"
// Authorisation system


router.get(
    "/",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })
  );

router.get("/login/success", (req, res) => {
   
 
    if (req.user||req.cookies) {
      res.status(200).json({
        success: true,
        message: "successfull",
        user: req.user,
        cookies: req.cookies
      })
    }else{
        
        res.status(401).json({
            success:false,
            message:"unSuccessfull"
        });
    }
  });
  
  router.get("/login/failed", (req, res) => {
    res.status(401).json({
      success: false,
      message: "failure",
    });
  });
  
  router.get("/logout", (req, res) => {
    req.logout();
    res.clearCookie("session");
    res.clearCookie("session.sig");
    res.clearCookie("__stripe_mid");
    
    res.redirect(`${CLIENT_URL}`);
  });



// auth with google+
router.get('/google', passport.authenticate('google', {
    scope: ['profile','email']
}));

// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.redirect(`${CLIENT_URL}/home`);
});



router.get("/getWatingusers", async(req,res)=>{
    try{
        const result=await UserSubscription.find({authorised:false});
    
        res.status(200).json(result);
    }catch(err){
        res.status(401).json(err);
    }
})



router.get("/getSubscribedUsers", async(req,res)=>{
    try{
        const result=await UserSubscription.find({authorised:true});
        
        res.status(200).json(result);
    }catch(err){
        res.status(401).json(err);
    }
})

router.put("/allowsubscription/:chatId",async(req,res)=>{
    try{
        const chatId=Number(req.params.chatId);

        const updatedvalue=await UserSubscription.updateOne({chatId:chatId},{
            $set:{
                authorised:true
            }
        })

        const result=await UserSubscription.find({authorised:false});

        res.status(200).json(result);
    }catch(err){
        res.status(401).json(err);
    }
})


router.delete("/deleterequest/:chatId",async(req,res)=>{
    try{
        const chatId=Number(req.params.chatId);

        const deletedvalue=await UserSubscription.deleteOne({chatId:chatId})

        const result=await UserSubscription.find({authorised:true});

        res.status(200).json(result);
    }catch(err){
        res.status(401).json(err);
    }
})

module.exports = router;