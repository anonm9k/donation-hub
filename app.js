// importing modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

// using modules
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(session({
    secret: "DONHUB",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

// declaring variables


// connecting to database
mongoose.connect("mongodb+srv://admin_anon:donationhub@cluster0.bdgfz.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true)

// creating db schema
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    phone: String,
    address: String,
    username: String,
    bgroup: String,
    donationDates: Array,
    recieveDates: Array
  });

// use passport as plugin for schema
userSchema.plugin(passportLocalMongoose);

// creating collection os users
const User = new mongoose.model("User", userSchema);

// using passport for authentication
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// get requests
totalUser = null;
app.get("/", function(req, res) {
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("login");
})

app.get("/register", function(req, res) {
    res.render("register");
})

app.get("/donate", function(req, res) {
    // iterate over recieved
    eachMonthRecieves = [0,0,0,0,0,0,0,0,0,0,0,0]
    req.user.recieveDates.forEach(element => {
        eachMonthRecieves[element[5]-1] = eachMonthRecieves[element[5]-1] + 1
    });
    eachMonthDonates = [0,0,0,0,0,0,0,0,0,0,0,0]
    req.user.donationDates.forEach(element => {
        eachMonthDonates[element[5]-1] = eachMonthDonates[element[5]-1] + 1
    });
    // req.user.id is the current user id
    if (req.isAuthenticated()) {
        res.render("donate", {email: req.user.email, username:req.user.username, bgroup:req.user.bgroup, address:req.user.address, phone:req.user.phone,
             donationDates:req.user.donationDates, recieveDates: req.user.recieveDates, eachMonthDonates:eachMonthDonates, eachMonthRecieves:eachMonthRecieves});
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function(req, res) {
    req.logout()
    res.redirect("/")
})

app.get("/requested", function(req, res) {
    const today = new Date()
    const datentime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+" at "+ 
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    req.user.recieveDates.push(datentime);
    req.user.save(function() {
        res.redirect("/donate")
    })
})

app.get("/donated", function(req, res) {
    const today = new Date()
    const datentime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+" at "+ 
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    req.user.donationDates.push(datentime);
    req.user.save(function() {
        res.redirect("/donate")
    })
})

app.get("/admin", function(req, res) {
    if (req.isAuthenticated()) {
        User.count({}, function(err, count) {
            if (err) { console.log(err)}
        })
        User.find({"email": {$ne: null}}, function(err, foundUser) {
            if (err) {
                console.log(err)
            } else {
                if (foundUser) {
                    res.render("admin", {userEmail: foundUser})
                }
            }
        })
        
    } else {
        res.redirect("/login");
    }
})
// post requests

app.post("/register", function(req, res) {

    User.register({
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        bgroup: req.body.bgroup,
        username: req.body.username, 
        }, 
        req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local") (req, res, function () {
                if (req.body.username == "admin") {
                    res.redirect("/admin")
                } else {
                res.redirect("/donate");
                }
            })
        }
    })
})

app.post("/login", function (req, res) {
    const user = new User({
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
        address: req.body.address,
        bgroup: req.body.bgroup,
        username: req.body.username,
    })

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local", {failureRedirect: '/login'}) (req,res, function() {
                if (req.body.username == "admin") {
                    res.redirect("/admin")
                } else {
                res.redirect("/donate"); }
            })
        }
    })
})

// opening port to listen
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000
}
app.listen(port, function() {
    console.log("Server started successfully...")
})

