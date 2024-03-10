const dotenv = require("dotenv").config({path:"./config.env"})
const bodyParser = require("body-parser")
const express = require("express")
const dbConnect = require("./config/dbConnect")
const { notFound, errorHandler } = require("./middleware/errorHandler");
const app = express();
const PORT = process.env.PORT || 4000


const adminRouter = require("./routes/adminRoute")
const userController = require("./controller/userController")
const authRouter = require("./routes/userRoute");
const productRouter = require("./routes/productRoute")

const cookieParser = require("cookie-parser")
const morgan = require("morgan")
const session = require("express-session")
const flash = require("connect-flash");
const MongoDBStore = require('connect-mongodb-session')(session);
//const otpGeneretor = require("otp-generator")

dbConnect()

const path = require("path");
const userMiddleware = require("./middleware/userMiddleware");
app.use(express.static("public"))
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.set("view engine","ejs")
app.set("views","./views")



const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'sessions',
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 4000000,
    },
}));
app.use(flash());

app.use(userMiddleware);
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())
app.get("/", userController.loginLoad)
app.use("/product", productRouter)
app.use("/admin",adminRouter)
app.use("/user", authRouter)
//console.log("basfbhjsb");

app.use(express.static('public'));



app.use(notFound)
app.use(errorHandler)


app.listen(PORT,()=>{
    console.log("Server is running");
})
