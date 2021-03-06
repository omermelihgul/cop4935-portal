//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const ObjectsToCsv = require('objects-to-csv');

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

mongoose.connect(process.env.MONGODB, { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  name: String,
  institution: String,
  username: String,
  password: String,
  access: Boolean,
  secret: String
});

const dataSchema = new mongoose.Schema({
  _id: mongoose.ObjectId,
  repo_owner: String,
  repo_full_name: String,
  repo_name: String,
  repo_id: Number,
  repo_url: String,
  commits: Number,
  pushes: Number,
  issues_opened: Number,
  issues_closed: Number,
  pull_requests_opened: Number,
  pull_requests_merged: Number
}, { collection: 'dataBotRepos' });

const dataSchema2 = new mongoose.Schema({}, { collection: 'commBotCommits' });
const dataSchema3 = new mongoose.Schema({}, { collection: 'issueClosure' });
const dataSchema4 = new mongoose.Schema({}, { collection: 'gamBotIssues' });
const dataSchema5 = new mongoose.Schema({}, { collection: 'gamBotLevels' });
const dataSchema6 = new mongoose.Schema({}, { collection: 'gamBotPushes' });



userSchema.plugin(passportLocalMongoose);

var User = mongoose.model("users", userSchema);
var collectedData = mongoose.model('dataBotRepos', dataSchema);
var collectedData2 = mongoose.model('commBotCommits', dataSchema2);
var collectedData3 = mongoose.model('issueClosure', dataSchema3);
var collectedData4 = mongoose.model('gamBotIssues', dataSchema4);
var collectedData5 = mongoose.model('gamBotLevels', dataSchema5);
var collectedData6 = mongoose.model('gamBotPushes', dataSchema6);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/data", function(req, res) {
  if (req.isAuthenticated()) {
    User.findById(req.user.id, function(err, foundUser) {
      if (err) {
        //console.log(err);
        res.redirect("/login");
      } else {
        if (foundUser) {
          if (foundUser.access === true) {
            User.find({}, '', function(err, foundUsers) {
              collectedData.find({}, '', function(err, data) {
                if (err) return handleError(err);
                res.render("data", { botData: data, users: foundUsers });

              });

            });
          } else {
            req.logout();
            res.render("accessNotGranted");
          }
        } else {
          res.render("invalidLogin");
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});


app.post("/data", function(req, res) {
  User.findOne({ username: req.body.username }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.access) {
          foundUser.access = false;
        } else {
          foundUser.access = true;
        }
        foundUser.save(function() {
          res.redirect("/data");
        });
      } else {
        res.redirect("/data");
      }
    }
  });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  User.register({ name: req.body.name, institution: req.body.institution, username: req.body.username, access: false }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.render("existingUser");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/data");
      });
    }
  });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { successRedirect: '/data', failureRedirect: '/login' })(req, res, function() {});
    }
  });

});

app.get("/download1", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./DataBotRepos.csv');

        res.download('./DataBotRepos.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

app.get("/download2", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData2.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./CommitsBot.csv');

        res.download('./CommitsBot.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

app.get("/download3", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData3.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./IssueClosure.csv');

        res.download('./IssueClosure.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

app.get("/download4", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData4.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./GamificationBotIssues.csv');

        res.download('./GamificationBotIssues.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

app.get("/download5", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData5.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./GamificationBotLevels.csv');

        res.download('./GamificationBotLevels.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

app.get("/download6", function(req, res) {
  if (req.isAuthenticated()) {
    collectedData6.find({}, '', function(err, data) {
      (async () => {
        const csv = new ObjectsToCsv(data);

        // Save to file:
        await csv.toDisk('./GamificationBotPushes.csv');

        res.download('./GamificationBotPushes.csv');
        // res.render("data");
      })();
    }).lean();
  } else {
    res.redirect("/login");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000.");
});