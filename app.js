const express=require("express");
const app=express();
const dotenv= require("dotenv");
const mongoose=require("mongoose");

const bodyParser = require('body-parser');

const cookieSession = require('cookie-session');
const passport = require('passport');
const session=require("express-session");
const passportsetup=require("./config/passport");
const cors=require("cors");


const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const UserSubscription=require("./models/UserSubscription");

const adminRoutes=require("./routes/adminRoute");



// var allowCrossDomain = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', "*");
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// }


app.use(
  cors({
    origin: "https://chatbotadminpanel.netlify.app",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// app.use(session({ secret: 'SumanSamanta', cookie: { maxAge: 600000 }}))

app.use(
  cookieSession({ name: "session", keys: ["Suman"], maxAge: 24 * 60 * 60 * 100 })
);
app.use(passport.initialize());
app.use(passport.session());
dotenv.config();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// app.use(allowCrossDomain);



// initialize passport


mongoose.connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    })
.then(()=>console.log("connection successful...Mongodb Database connected successfully"))
.catch((err)=>console.log(err));

const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN;
const OPENWEATHERMAP_API_KEY = process.env.WEATHER_API_KEY



const bot = new TelegramBot(TELEGRAM_BOT_TOKEN,{polling:true});


const storage = {}

const subscribed=false;



// Define a data structure to store user subscriptions
const subscriptions = new Map();


// Subscribe command
const getSubscribed=async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userFirstName=msg.chat.first_name;
  const userLastName=msg.chat.last_name;


  const newUser=await UserSubscription.find({chatId:chatId});
  const subscribedUser=await UserSubscription.find({chatId:chatId,authorised:true});
  if (!newUser.length>0) {
    subscriptions.set(userId,true);
    const newSubscription=new UserSubscription({
        chatId:chatId,
        firstName:userFirstName,
        lastName:userLastName,
        authorised:false
    });

    const savedUser=await newSubscription.save();

    bot.sendMessage(chatId,'Please Wait for Verification! Check back later',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'start', callback_data: '/start' }],
            ],
          }
        })
      
  } else if(subscribedUser.length>0) {
    bot.sendMessage(chatId, 'You are already subscribed.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'start', callback_data: '/start' }],
        ],
      }
    });
  }
  
};

// Unsubscribe command
// const getUnsubscribed= async(msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   const subscribedUser=await UserSubscription.find({chatId:chatId});
  
//   if (subscribedUser.length>0) {
//     const deletedUser=await UserSubscription.deleteOne({chatId:chatId})

//     bot.sendMessage(chatId, 'You are now unsubscribed.');
//   } else {
//     bot.sendMessage(chatId, 'You are not subscribed.');
//   }


// };

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    const userId = msg.from.id;
  
    const subscribedUser=await UserSubscription.find({chatId:chatId,authorised:true});
    const waitedUser=await UserSubscription.find({chatId:chatId});
 
    if(subscribedUser.length>0){
        bot.sendMessage(
            chatId,
            'Hello! This bot can show you the weather at any. To use it, please choose an option below:',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Get Weather', callback_data: 'get_weather' }],
                ],
              },
            }
          )
    }
    else{
        bot.sendMessage(chatId,'Please Subscribe first to use the features',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Subscribe', callback_data: '/subscribe' }],
            ],
          }
        }
        );
    }
    
    
  })

  const getStarted=async(msg)=>{
    const chatId = msg.chat.id
    const userId = msg.from.id;
  
    const subscribedUser=await UserSubscription.find({chatId:chatId,authorised:true});
    const waitedUser=await UserSubscription.find({chatId:chatId,authorised:false});
 
    if(subscribedUser.length>0){
        bot.sendMessage(
            chatId,
            'Hello! This bot can show you the weather at any. To use it, please choose an option below:',
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Get Weather', callback_data: 'get_weather' }],
                ],
              },
            }
          )
    }else if(waitedUser.length>0){
        bot.sendMessage(chatId,'Please Wait for Verification! Check back later',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'start', callback_data: '/start' }],
            ]
          }
        })
    }
    else{
        bot.sendMessage(chatId,'Please Subscribe first to use the features',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Subscribe', callback_data: '/subscribe', }],
            ],
          }
        }
        );
    }
    
    
  }

  function getUserData(chatId) {
    let userData = storage[chatId]
    if (!userData) {
      userData = {
        waitingForCity: false,
        waitingForWeather: false
      }
      storage[chatId] = userData
    }
    return userData
  }
  


  
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id
    const data = callbackQuery.data
    const msg=callbackQuery.message

  
    switch (data) {
      case 'get_weather':
        const userDataWeather = getUserData(chatId)
        userDataWeather.waitingForCity = true
        userDataWeather.waitingForWeather = true
        bot.sendMessage(chatId, 'Please enter the name of the city or send /stop to cancel:')
        break

      case '/subscribe':
          const subscribed=getSubscribed(msg);
      
      case '/start':
        const started=getStarted(msg);

      default:
        break
    }
  })


  bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text
  
    const userData = getUserData(chatId)
    if (userData && userData.waitingForCity) {
      const city = text
      let messageText = ''
      if (userData.waitingForWeather) {
        messageText = await getWeatherData(city)
      }
      bot.sendMessage(chatId, messageText,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'start', callback_data: '/start' }],
            
            ],
          }
        })
      resetUserData(chatId)
    }
  })

  
async function getWeatherData(city) {

    try{
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}`
      )
  
   
        const weatherData = response.data
        const weatherDescription = weatherData.weather[0].description
        const temperature = Math.round(weatherData.main.temp - 273.15)
        const messageText = `The weather in ${city} is currently ${weatherDescription} with a temperature of ${temperature}°C.`
        return messageText
      
    }catch{
      const messageText="Please Enter a Proper City Name"
      return messageText
    }
    
     
    
    
  }
  
  

  function resetUserData(chatId) {
    const userData = getUserData(chatId)
    userData.waitingForCity = false
    userData.waitingForWeather = false
    
  }




app.use("/server/auth",adminRoutes);



module.exports=app;