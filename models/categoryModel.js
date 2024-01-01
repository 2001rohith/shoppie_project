const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,  // Minimum length of 1 character
    maxlength: 10,  // Maximum length (adjust as needed)
    validate: {
      validator: function (value) {
        return !(value.trim() === '' || value !== value.trim());
      },
      message: 'Invalid category name',
    },
  },
});

module.exports = mongoose.model('Category', categorySchema);
