const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }

  console.log("MK JAAT:- ", token , "  JAT  " , process.env.JWT_SECRET);
  const decodedData = jwt.verify(`${token}`, `${process.env.JWT_SECRET}`);
  console.log("decodedData :-", decodedData);

  req.user = await User.findById(decodedData.payload);
  console.log("userDetails: -" , req.user);

  next();
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resouce `,
          403
        )
      );
    }
    next();
  };
};
