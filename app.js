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
    dateJoined: String,
    email: String,
    username: String,
    password: String,
    phone: String,
    address: String,
    city: String,
    bgroup: String,
    donationDates: Array,
    recieveDates: Array,
    isAdmin: Boolean,
    hospitalName: String
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
    // iterate over recieved & donates
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
        res.render("donate", {user:req.user, eachMonthDonates:eachMonthDonates, eachMonthRecieves:eachMonthRecieves});
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
        admin = req.user
        User.count({}, function(err, count) {
            if (err) { console.log(err)}
        })
        User.find({"email": {$exists: true}}, function(err, foundUser) {
            if (err) {
                console.log(err)
            } else {
                if (foundUser) {
                    totalUser = null;
                    totalRequests = null;
                    totalDonations = null;
                    foundUser.forEach(function(user) {
                        totalUser = totalUser + 1;
                        totalRequests = totalRequests + user.recieveDates.length
                        totalDonations = totalDonations + user.donationDates.length
                    })
                    res.render("admin", {admin: admin, Users: foundUser, totalUser: totalUser, totalRequests: totalRequests, totalDonations: totalDonations})
                }
            }
        })
        
    } else {
        res.redirect("/login");
    }
})

// post requests

app.post("/register", function(req, res) {
    const today = new Date()
    const datentime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+" at "+ 
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    if (req.body.adminKey == "iamadmin") {
        isAdminValue = true;
    } else {
        isAdminValue = false;
    }
    User.register({
        dateJoined: datentime,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        bgroup: req.body.bgroup,
        username: req.body.username, 
        isAdmin: isAdminValue,
        hospitalName: ""
        }, 
        req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local") (req, res, function () {
                if (req.body.adminKey == "iamadmin") {
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
        username: req.body.username,
        password: req.body.password,
    })

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local", {failureRedirect: '/login'}) (req,res, function() {
                if (req.user.isAdmin == true) {
                    res.redirect("/admin")
                } else {
                res.redirect("/donate"); }
            })
        }
    })
})

app.post("/resetPassword", function(req, res) {
    if (req.body.newpassword != "") {
        req.user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
            if(err) {
                console.log(err)
            } else {
                res.redirect("/donate")
            }
        })
    } else {
        res.redirect("/donate")
    }
})

app.post("/updateinfo", function(req, res) {
     if (req.body.username != "") {
        req.user.username = req.body.username;
     } else if (req.body.email != "") {
         req.user.email = req.body.email;
     } else if (req.body.phone != "") {
        req.user.phone = req.body.phone;
    } else if (req.body.address != "") {
        req.user.address = req.body.address;
    } else if (req.body.bgroup != "") {
        req.user.bgroup = req.body.bgroup
    } else if (req.body.city != "") {
        req.user.city = req.body.city;
    } else if (req.body.hospital != "") {
        req.user.hospitalName = req.body.hospital;
    }
    req.user.save(function(err) {
        if (err) {
            console.log(err)
        } else {
        req.logout()
        res.redirect("/login")
        }
    })
})

app.post("/addHospital", function(req, res) {
    req.user.hospitalName = req.body.hospital
    req.user.save(function(err) {
        if (err) {
            console.log(err)
        } else {
        res.redirect("/admin") }
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

