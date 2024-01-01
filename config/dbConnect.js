const { default: mongoose } = require("mongoose")

const dbConnect = ()=>{
    try {
        const conn  =  mongoose.connect(process.env.MONGODB_URL)
        console.log("databasee connected");
    } catch (error) {
        console.log("databse connection error");
    }
}



module.exports = dbConnect