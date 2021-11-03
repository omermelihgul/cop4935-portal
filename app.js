//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  name: String,
  institution: String,
  username: String,
  password: String,
  access: Boolean,
  secret: String
});

const dataSchema = new mongoose.Schema ({
  commits: Number,
  pushes: Number,
  issues_opened: Number,
  issues_closed: Number,
  pull_requests_opened: Number,
  pull_requests_merged: Number
}, {collection : 'dataBotRepos'});


userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("users", userSchema);
var collectedData = mongoose.model('dataBotRepos', dataSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/data", function(req, res){
  collectedData.find({},'', function (err, data) {
    if (err) return handleError(err);
    User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
      res.render("invalidLogin");
    } else {
      if (foundUser) {
        if (foundUser.access === true){
          User.find({},'', function (err, foundUsers) {
            res.render("data", {botData: data, users: foundUsers});
          });
        } else {
          res.render("accessNotGranted");
        }
      } else {
        res.render("invalidLogin");
      }
    }
  });
  });
});

app.post("/data", function(req, res){
  User.findOne({username: req.body.username}, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.access = true;
        foundUser.save(function(){
          res.redirect("/data");
        });
      } else {
        res.redirect("/data");
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({name: req.body.name, institution: req.body.institution, username: req.body.username, access: false}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.render("existingUser");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/data");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/data");
      });
    }
  });

});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server started on port 3000.");
});
