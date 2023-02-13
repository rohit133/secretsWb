//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
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
    password : String,
    googleId : String,
    secret: String
});

// applying plugin to mongoon Db Schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Creating mongoose model and adding plugin 
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Serializing the user using passport 
passport.serializeUser(function(user, cb){
    process.nextTick(function() {
        cb(null, { id: user.id, username: user.username, name: user.displayName });
    });
});

// Deserializing the user using passport 
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

// Creating Google Strategy using Passport.
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// Routing to home 
app.get("/", function(req,res){
    res.render("home");
});

// Redirecting to googel auth and callback after login with Google. 
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

// Routing to Login 
app.get("/login", function(req,res){
    res.render("login");
});

// Routing to Register page
app.get("/register", function(req,res){
    res.render("register");
});


// finding Secrest from the DB.
app.get("/secrets", function(req, res){
    User.find({"secret": {$ne:null}}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                res.render("secrets", {userWithSecrets: foundUser});
            }
        }
    });
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});


// Posting new Secrets to the Authenticated User.

app.post("/submit", function(req,res){
    const submittedSecrets = req.body.secret;
    User.findById(req.user  .id, function(err, foundUser){
        if(err){
            console.log(err);
        }else {
            if(foundUser) {
                foundUser.secret = submittedSecrets;
                foundUser.save(function(){
                    res.redirect("/secrets")
                }); 
            }
        }
    });
});



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



// Port is running on 8000 for Deployment purpose.
app.listen(8000, function(){
    console.log("Server started at port 8000!");
});