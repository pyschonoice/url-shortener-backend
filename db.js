const mongoose = require('mongoose')
const {Schema, model } = mongoose

const storeSchema = new Schema({
    userId : {type: Schema.Types.ObjectId,ref:"User"},
    longUrl : {type: String, required:true,trim:true},
    shortUrl : {type: String, required:true, unique: true},
   createdAt: {
    type: Date,
    default : Date.now
   },
    expiresIn :{
        type: Number, // store in hours 
        default: 24,
        min : 1,
        max : 720 // 30 days
    },
    expireAt :{
        type: Date,
        index : { expires : 0}
    },
    clicks:{
        type: Number,
        default:0,
    },
    isActive:{
        type:Boolean,
        default: true
    }

})

// Automatically set expireAt before saving
storeSchema.pre('save', function (next) {
  if (this.expiresIn) {
    this.expireAt = new Date(Date.now() + this.expiresIn * 3600 * 1000);
  }
  next();
});

const userSchema = new Schema({
    email : {type:String, required:true,unique:true},
    passwordHash :{type:String,required:true}
})

const userModel = model("User",userSchema)

const storeModel = model("Store",storeSchema)
module.exports = {
    storeModel,
    userModel
}