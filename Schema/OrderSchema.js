  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

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
       date:{
        type: String,
        required: true,
       }
  });


  const Order = mongoose.model('Order', orderSchema);

  module.exports = Order;