const crypto = require("crypto");

const generateResetToken = () => {
  const tokenTime = Date.now();
  const token = crypto.randomBytes(32).toString("hex") + ":" + tokenTime;
  return token;
};


const verifyResetToken = (token, expirationTimeInMinutes = 30) => {
  try {
    const tokenTime = parseInt(token.split(":")[1], 10);
    const currentTime = Date.now();
    const expirationTime = tokenTime + expirationTimeInMinutes * 60 * 1000;

    console.log("Token Time:", new Date(tokenTime));
    console.log("Current Time:", new Date(currentTime));
    console.log("Expiration Time:", new Date(expirationTime));

    return currentTime <= expirationTime;
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return false;
  }
};


module.exports = { generateResetToken, verifyResetToken };
