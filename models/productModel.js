const mongoose = require('mongoose');
const Category = require("./categoryModel");

var productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (value) {
                return /^(?!\s+$).+/s.test(value);
            },
            message: 'Title must contain at least one non-space character.'
        }
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: 'Price should not be negative'
        }
    },
    offerPrice: {
        type: Number,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    brand: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^[^\s]+$/.test(value);
            },
            message: 'Spaces are not allowed in the brand'
        }
    },
    quantity: {
        type: Number,
        required: true,
    },
    sold: {
        type: Number,
        default: 0,
    },
    images: {
        type: [String],
        required: true,
        validate: [array => array && array.length > 0, 'At least one image URL is required'],
    },
    color: {
        type: String,
        required: true
    },
    softDelete: {
        type: Boolean,
        default: false
    },
    ratings: [{
        star: {
            type: Number,
            required: true,
        },
        postedby: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],

}, { timestamps: true });

productSchema.index({ category: 1, title: 1 });


module.exports = mongoose.model('Product', productSchema);
