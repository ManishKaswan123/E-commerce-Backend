const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
const { connect } = require("http2");

// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  // const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  //   folder: "avatars",
  //   width: 150,
  //   crop: "scale",
  // });

  console.log("req.body :- ", req.body);

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "kdsmf",
      url: "renrfnfknwo"
    }
    // avatar: {
    //   public_id: myCloud.public_id,
    //   url: myCloud.secure_url,
    // },
  });

  sendToken(user, 201, res);
});

// Login User
// exports.loginUser = catchAsyncErrors(async (req, res, next) => {
//   const { email, password } = req.body;

//   // checking if user has given password and email both

//   if (!email || !password) {
//     return next(new ErrorHander("Please Enter Email & Password", 400));
//   }
//   const user = await User.findOne({ email }).select("+password");

//   if (!user) {
//     console.log("Working");
//     return next(new ErrorHander("Invalid email or password", 401));
//   }

//   const isPasswordMatched = await user.comparePassword(password);

//   if (!isPasswordMatched) {
//     return next(new ErrorHander("Invalid email or password", 401));
//   }
//   console.log("user" , user);
//   sendToken(user, 200, res);
// });

exports.loginUser = catchAsyncErrors(async (req , res , next) => {
  try {
    const { email, password } = req.body;
    console.log("req.body:-", req.body);
      if(email && password) {
        const user = await User.findOne({ email }).select("+password");
          if(user) {
              const isPasswordMatched = await user.comparePassword(password);
              if(isPasswordMatched) {
                  let token = user.getJWTToken();
                  res.cookie('login' , token , {httpOnly: true});

                  return res.json({
                      success: true,
                      user,
                      token
                  });
              }
              else {
                return next(new ErrorHander("Invalid email or password", 401));
              }
          }
          else {
            return next(new ErrorHander("Please Enter Email & Password", 400));
          }
      }
      else {
          return res.json({
              message: "Input is Empty"
          });
      }
  }
  catch(err) {
      return res.json({
          message: err.message
      });
  }
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
console.log("Forgot password is running :- ", req.body.email , "User is :-", user);
  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();
console.log("resetToken is :- ", resetToken);
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = `Your password reset token is  :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  try {
    sendEmail("forgotPassword" , 
      {
        email: user.email,
        subject: `Ecommerce Password Recovery`,
        message,
      }
    );

    console.log("message is :- ", message);
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not password", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  let user;
  if(req.id)
    user = await User.findById(req.id);
  else if(req.email)
    user = await User.find({email});
  else
    return next(new ErrorHander("Login to Access Resourse", 400));
  res.status(200).json({
    success: true,
    user,
  });
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  console.log("ID is :-",req.body.id);
  
  const user = await User.findById(req.body.id).select("+password");

  console.log("user :-",user);
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;

  console.log("Update profile backend is working");
  const findUser = await User.findOne({ email });
  const userId = findUser._id;

  if (req.body.avatar !== "") {
    const user = await User.findById(userId);
    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    findUser.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  findUser.name = name;
  findUser.email = email;

  await findUser.save();

  res.status(200).json({
    success: true,
  });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
