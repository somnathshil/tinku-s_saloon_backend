require('dotenv').config();
const express = require("express");
 const app = express();
 const mongoose = require('mongoose');
const User = require("./Schema/UserSchema.js");
const Order = require("./Schema/OrderSchema.js");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bodyParser = require("body-parser");
const cors = require("cors");


const mongoUrl = process.env.MONGO_ATLAS;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors(
    {
        origin: 'http://localhost:5173',  // React frontend URL
        credentials: true  // Allow cookies to be sent
    }
));

main().then(()=>console.log("DB is connected")).catch(err => console.log(err));

async function main() {
  await mongoose.connect(mongoUrl);
}

const store = MongoStore.create({
    mongoUrl: mongoUrl,
    secret: process.env.SECRET,
    touchAfter: 24 * 3600,
});

store.on("error", ()=>{
    console.log("Error In Mongo Session Store", err);
  });

app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        expires: Date.now() + 7 * 24 * 3600 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
     }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const isLoggedIn =(req, res, next)=>{
    if(req.isAuthenticated){
        return next();
    }
    res.status(400).json({message:"Log in first"});
};


//This is for checking session working or not:
app.use((req, res, next) => {
    console.log("Session:", req.session);
    console.log("User in request:", req.user);
    next();
});


app.get("/", (req, res)=>{
    res.send("hello world");
});

app.post("/signup", async (req, res) => {
    try {
        // Destructure the data from the request body
        let { username, password, mobileNumber } = req.body;

        // Create a new User instance
        let newUser = new User({
            username: username,
            mobileNumber: mobileNumber,
        });

        // Register the user with passport-local-mongoose
        let registeredUser = await User.register(newUser, password);

        console.log("Sign Up Successful!");
        console.log(registeredUser);

        // Send a JSON response with user data (excluding password)
        const {password: userPassword, ...userData } = registeredUser.toObject();
        res.json({
            message: "Sign Up Successful!",
            user: userData,
        });
    } catch (err){
        res.status(400).json({
            message: "Data entry is wrong!!",
            error: err,
        })
       }
});

app.post('/login', passport.authenticate('local'), (req, res) => { 
        // res.json({ message: "Logged in successfully!", user: req.user });
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ message: 'Session save error', error: err });
            }
            res.json({ message: "Logged in successfully!", user: req.user });
        });
        
});

app.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ message: 'Logged out successfully' });
    });
});


app.post("/booking", isLoggedIn,  async (req, res)=>{
    const userId = req.user;
    try{
    let {name, mobileNumber, address, eventName, serviceDate} = req.body;
    let newOrder = new Order({
        name,
        mobileNumber,
        address,
        eventName,
        serviceDate,
        userId,
    });
   let sucessData = await newOrder.save();
   console.log(sucessData);
   let orderData = sucessData.toObject();



const user = await User.findById(req.user._id); 
user.orders.push(orderData._id);
await user.save();



   res.json({
    order: orderData,
    message:"Congratulations booking successfully done!!",
   });
} catch (err){
        res.status(400).json({
            message: "Data entry is wrong!!",
            error: err,
        })
       }

});



app.get("/user/:id", async (req, res)=>{
          let {id} =req.params;
          let resData = await User.findById(id).populate('orders');
          if(resData){
            res.json({
                message:"Result sent successfully!!",
               fetchUser: resData,
            });
          }else{
            res.status(400).json({
                message:"Something error from Db",
            });
          }
});


app.put("/booking/:id", async(req, res)=>{
    const {id} = req.params;
    const updatedData = req.body;
    try{
    const result = await Order.findByIdAndUpdate(id, { $set: updatedData }, { new: true });
    if (!updatedData) {
        return res.status(404).json({ message: "Booking not found!" });
      }
      res.json({ message: "Booking updated successfully!", updatedBookingData: result });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: "Server error during update!", error: error });
    }
});

app.delete("/booking/:id", async (req, res)=>{
      const {id} = req.params;
      try{
        const result = await Order.findByIdAndDelete(id);
        if(!result){
            res.status(404).json({message:"Booking is not deleted due to wrong data"});
        } 
        res.json({message:"Booking has been deleted successfully!", result: result});
      } catch(error){
        res.status(500).json({message:"Server error during delete!", error: error});
      }
});



 app.listen(8080, (req, res)=>{
    console.log("app is listening at port 8080");
 });