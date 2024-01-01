const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rohithkrishnankv1@gmail.com',
      pass: 'epfy swgr kkmn qvjv',
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

