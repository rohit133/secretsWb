//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');
mongoose.set("strictQuery", false);

// Initializing the Session and Passport and setup passport with session 
app.use(session({
    secret: "Thisismytestingsecret.",
    resave: false,
    saveUninitialized: false,
}));    

app.use(passport.initialize());
app.use(passport.session());

// connecting with the DB using mongoose
mongoose.connect("mongodb://0.0.0.0:27017/userDB");

// Creating user schema 
const userSchema = new mongoose.Schema({
    username : String,
    password : String
});

// applying plugin to mongoon Db Schema
userSchema.plugin(passportLocalMongoose);

// Creating mongoose model and adding plugin 
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Routing to home 
app.get("/", function(req,res){
    res.render("home");
});

// Routing to Login 
app.get("/login", function(req,res){
    res.render("login");
});

// Routing to Register page
app.get("/register", function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

// Logging out from the Website.
app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/"); 
        }
    });
})


// Adding new user to db 
app.post("/register", function(req,res){
    User.register({username : req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/")
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            });
        }  
    });
});

// Login with exsiting user through username & password
app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            });
        } 
    });
});

app.listen(3000, function(){
    console.log("Server started at port 3000!");
});