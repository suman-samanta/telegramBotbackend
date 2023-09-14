const express=require("express");


const http=require("http");

const app=require('./app');


const config=require('./config/default');

const port=config.port;

try{
    const server=http.createServer(app);
    server.listen(port);
    console.log("server is running on port : "+port);
}catch(err){
    console.log(err);
}
