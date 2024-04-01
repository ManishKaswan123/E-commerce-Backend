// Create Token and saving in cookie

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.cookie('login' , token , {
    httpOnly: true,
  });

  return res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};

module.exports = sendToken;
