//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://127.0.0.1:27017/secretDB");

/* console.log(process.env.API_KEY); */
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
  
});

const appoinmentSchema =new mongoose.Schema({
  name:String,
  department:String,
  doctor:String,
  date:Date
})
const Appoinment = new mongoose.model("Appoinment" , appoinmentSchema);
userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/SRM-DENTAL",
  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.post("/appoint" , (req, res) => {
  const name=req.body.person;
  const department=req.body.department;
  const doctor=req.body.doctor;
  const date=req.body.date;
  const appoinment=new Appoinment({
    name:name,
    department:department,
    doctor:doctor,
    date:date
  })
  appoinment.save();
})
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get(
  "/auth/google/SRM-DENTAL",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({ "secret": { $ne: null } }).then(function (foundUsers) {
    if (foundUsers) {
      res.render("secrets", { usersWithSecrets: foundUsers });
    }
  })
  .catch(function (err) {
    console.log(err);
  })
});

/* app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
}); */

/* app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;
  console.log(req.user.id);

  User.findById(req.user.id)
    .then(function (foundUser) {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser
          .save()
          .then(function () {
            res.redirect("/secrets");
          })
          .catch(function (err) {
            console.log(err);
          });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}); */



app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password)
    .then(function (user) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/register");
    });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Successfully started port on 3000");
});
