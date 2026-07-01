const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    latitude:{
        type:Number,
        required:true
    },
    longitude:{
        type:Number,
        required:true
    },
    city:{
        type:String,
        default:"Unknown"
    },
    country:{
        type:String,
        default:"Unknown"
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});
module.exports = mongoose.model("User", userSchema);