const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    offerPercentage: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type:Date,
        required:true
    }
});

module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);
