//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const bycrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const saltRounds = 10;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');

// connecting with the DB using mongoose
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://0.0.0.0:27017/userDB");

// Creating user schema 
const userSchema = new mongoose.Schema({
    username : String,
    password : String
});
// Creating mongoose model and adding plugin 
const User = new mongoose.model("User", userSchema);


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

// Adding new user to db 
app.post("/register", function(req,res){
    bycrypt.hash(req.body.password, saltRounds, function(err, hash){
        const newUser = new User ({
            username : req.body.username,
            password : hash
        }); 
        newUser.save(function(err){
            if(!err){
                res.render("secrets");
            } else {
                res.render(err);
            }
        });
    }); 
});

// Login with exsiting user through username & password
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({username : username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser) {
                bycrypt.compare(password, foundUser.password, function(err, result){
                    if(result === true){
                        res.render("secrets");
                    }
                    else {
                        res.render("Incorrect Password Please retry!");
                    }
                });
            }   
        }
    }) 
});


















app.listen(3000, function(){
    console.log("Server started at port 3000!");
});