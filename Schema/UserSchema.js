const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    mobileNumber:{
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v.toString());
            },
            message: props => `${props.value} is not a valid 10-digit number!`
        }
    },
    orders:[{
        type: Schema.Types.ObjectId,
        ref: 'Order',
    }],
    
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;

