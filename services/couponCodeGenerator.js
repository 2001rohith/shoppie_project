
function generateCouponCode(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let couponCode = '';
    for (let i = 0; i < length; i++) {
      const charIndex = Math.floor(Math.random() * characters.length);
      couponCode += characters.charAt(charIndex);
    }
    return couponCode;
  }
  
  module.exports = { generateCouponCode };
  