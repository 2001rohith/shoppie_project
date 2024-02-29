const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
    maxlength: 10,
    validate: {
      validator: function (value) {
        return !(value.trim() === '' || value !== value.trim());
      },
      message: 'Invalid category name',
    },
  },
});

module.exports = mongoose.model('Category', categorySchema);
