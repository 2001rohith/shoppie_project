const generateOTP = () => {
    const otpLength = 6;
    const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, otpLength);
    return otp;
  };
  
  module.exports = generateOTP;