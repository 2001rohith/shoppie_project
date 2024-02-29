const mongoose = require("mongoose")

var returnSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^(?!\s+$).+/s.test(value);
            },
            message: 'Title must contain at least one non-space character.'
        }
    },
    images: {
        type: [String],
        required: true,
        validate: [array => array && array.length > 0, 'At least one image URL is required'],
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    status: { type: String, default: 'pending' },
})

module.exports = mongoose.model('Return', returnSchema)