const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  },
  country: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20
  },
  state: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20
  },
  district: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20
  },
  city: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20
  },
  street: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50 
  },
  housename: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  pincode: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return /^[1-9]\d*$/.test(value);
      },
      message: props => `${props.value} is not a valid pincode. Pincode should not start with zero and should be a positive integer.`
    }
  }
});

module.exports = mongoose.model('Address', AddressSchema);

