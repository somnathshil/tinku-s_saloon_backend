  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;
  const User = require("./UserSchema.js");

  const orderSchema = new Schema({
       name:{
          type: String,
          required: true,
       },
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
       address:{
        type: String,
        required: true,
       },
       eventName:{
          type: String,
          required: true,
       },
       serviceDate:{
        type: String,
        required: true,
       },
       createdAt: {
        type: Date,
        default: Date.now
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
     }
  });

  orderSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await User.updateOne(
            { _id: doc.userId },
            { $pull: { orders: doc._id } }  // Remove order ID from the user's orders array
        );
    }
});


  const Order = mongoose.model('Order', orderSchema);

  module.exports = Order;