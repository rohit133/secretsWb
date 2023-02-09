//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.set('view engine', 'ejs');

// connecting with the DB using mongoose
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://0.0.0.0:27017/userDB");

// Creating user schema 
const userSchema = {
    username : String,
    password : String
}
// Creating mongoose model 
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
    const newUser = new User ({
        username : req.body.username,
        password : req.body.password
    })
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        } else {
            res.render(err);
        }
    })
})

// Login with exsiting user through username & password
app.post("/login", function(req, res){
    const username = req.body.username;
    const userPass = req.body.password;
    User.findOne({username : username}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser) {
                if(foundUser.password === userPass){
                    res.render("secrets")
                }else {
                    console.log("User password is wrong please check your password!");
                }
            }
        }
    }) 
});


















app.listen(3000, function(){
    console.log("Server started at port 3000!");
});