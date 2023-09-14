const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const keys = require('./keys');
const AdminUser = require("../models/AdminUser");
const dotenv= require("dotenv");
dotenv.config();

const GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET;

// const BACKEND_URL="http://localhost:5000"
// const urljoin=require("url-join");
;


passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/server/auth/google/redirect"
    }, (accessToken, refreshToken, profile, done) => {
        // check if user already exists in our own db

        AdminUser.findOne({oauthId: profile.id}).then((currentUser) => {
            if(currentUser){
                // already have this user
               console.log("previous")
                done(null, currentUser);
            } else {
                // if not, create user in our db
                console.log("new user")
                new AdminUser({
                    
                    oauthId:profile.id,
                    name:profile.displayName,
                    email:profile.emails[0].value,
                    role:"admin"
                }).save().then((newUser) => {
                
                    done(null, newUser);
                });
            }
        });
    })
);




passport.serializeUser((user, cb) => {
    cb(null, user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });