const path = require('path');
const multer = require('multer');
const SharpMulter  = require("sharp-multer");

/*const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/productImages'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
*/



const storage = SharpMulter({
  destination: (req, file, callback) => callback(null, path.join(__dirname, '../public/productImages')),

  imageOptions: {
    fileFormat: "png",
    quality: 100,
    resize: { width: 500, height: 500 },
  },
});

const upload = multer({storage: storage});

module.exports = upload
