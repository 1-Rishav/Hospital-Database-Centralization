//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const _ = require("lodash");
const app = express();
const play = require("play-sound");

const Password = 123456;
const homeStartingContent =
  "Welcome to my corner of the internet! I'm Rishav Raj, a passionate and driven Web-Developer and Programmer. With a blend of creativity and expertise, I strive to be a professional Web-Developer and master in DSA , craft visually stunning designs that communicate powerful narratives or develop innovative software solutions that solve real-world challenges";
const aboutContent =
  "<p>Welcome to my corner of the internet! I'm Rishav Raj, a passionate and driven Web-Developer and Programmer . With a blend of creativity and expertise, I strive to be a professional Web-Developer and master in DSA , craft visually stunning designs that communicate powerful narratives or develop innovative software solutions that solve real-world challenges</p>";

("<p>A Journey of Curiosity</p>;");

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

const appoinmentSchema = new mongoose.Schema({
  Email: String,
  Number: Number,
  Name: String,
  Department: String,
  Doctor: String,
  Date: Date,
});
const postSchema = {
  hospitalname: String,
  hospitalslogan: String,
  doctorname: String,
  qualification: String,
  name: String,
  email: String,
  age: Number,
  sex: String,
  date: String,
  medicine: String,
  test: String,
  content: String,
  address: String,
  hospitalcontact: String,
};

const Post = mongoose.model("Post", postSchema);
userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
const Appoinment = new mongoose.model("Appoinment", appoinmentSchema);

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/SRM-DENTAL",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.post("/appoint", (req, res) => {
  const appoinment = new Appoinment({
    Email: req.body.email,
    Number: req.body.tel,
    Name: req.body.person,
    Department: req.body.department,
    Doctor: req.body.doctor,
    Date: req.body.date,
  });
  appoinment.save();

  res.redirect("/home2");
});
app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

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
  User.find({ secret: { $ne: null } })
    .then(function (foundUsers) {
      if (foundUsers) {
        res.render("secrets", { usersWithSecrets: foundUsers });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

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
        res.redirect("/home2");
      });
    }
  });
});

app.get("/home2", function (req, res) {
  res.render("home 2", { startingContent: homeStartingContent });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/staff", function (req, res) {
  res.render("staffpass");
});
app.get("/client", (req, res) => {
  res.render("client");
});

app.post("/staffpass", function (req, res) {
  const password = req.body.password;
  if (password == Password) {
    res.render("compose.ejs");
  } else {
    console.log("err");
  }
});

app.post("/compose", function (req, res) {
  const post = new Post({
    hospitalname: req.body.postHospital,
    hospitalslogan: req.body.postSlogan,
    doctorname: req.body.postDoctor,
    qualification: req.body.postQualification,
    name: req.body.postName,
    email: req.body.postEmail,
    age: req.body.postAge,
    sex: req.body.postSex,
    date: req.body.postDate,
    medicine: req.body.postMedicines,
    test: req.body.postTest,
    content: req.body.postBody,
    address: req.body.postAddress,
    hospitalcontact: req.body.postContact,
  });
  post.save();
  res.send("Thank You");
});

app.post("/requestEmail", (req, res) => {
  Post.findOne({ email: req.body.postEmail })
    .then(function (post) {
      res.render("post", {
        hospitalname: post.hospitalname,
        hospitalslogan: post.hospitalslogan,
        doctorname: post.doctorname,
        qualification: post.qualification,
        name: post.name,
        email: post.email,
        age: post.age,
        sex: post.sex,
        date: post.date,
        medicine: post.medicine,
        test:post.test,
        content: post.content,
        hospitaladdress: post.address,
        hospitalcontact: post.hospitalcontact,
      });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/requestNumber", (req, res) => {
  Appoinment.findOne({ Number: req.body.postNumber })
    .then(function (appoinment) {
      res.render("appoinment", {
        Email: appoinment.Email,
        Number: appoinment.Number,
        Name: appoinment.Name,
        Department: appoinment.Department,
        Doctor: appoinment.Doctor,
        date: appoinment.Date,
      });
    })
    .catch(function (err) {
      console.log(err);
    });
});
app.get("/home2:postId", function (req, res) {
  const requestedName = req.params.postId;
  Post.findOne({ email: requestedName })
    .then(function (post) {
      res.render("post", {
        hospitalname: post.hospitalname,
        hospitalslogan: post.hospitalslogan,
        doctorname: post.doctorname,
        qualification: post.qualification,
        name: post.name,
        email: post.email,
        age: post.age,
        sex: post.sex,
        date: post.date,
        medicine: post.medicine,
        test: post.test,
        content: post.content,
        hospitaladdress: post.hospitaladdress,
        hospitalcontact: post.hospitalcontact,
      });
    })
    .then(function (err) {
      console.log(err);
    });
});

app.get("/about:appointId", (req, res) => {
  const requestedappoint = req.params.appointId;
  Appoinment.findOne({ Number: requestedappoint })
    .then(function (appoinment) {
      res.render("appoinment", {
        Email: appoinment.Email,
        Number: appoinment.Number,
        Name: appoinment.Name,
        Department: appoinment.Department,
        Doctor: appoinment.Doctor,
        date: appoinment.Date,
      });
    })
    .then(function (err) {
      console.log(err);
    });
});
app.listen(3000, function () {
  console.log("Successfully started port on 3000");
});
