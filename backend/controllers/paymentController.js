const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  const { email, name, amount , description , address} = req.body;

  // Create a customer
  const customer = await stripe.customers.create({
    email,
    name ,
    address
  });

  const paymentIntent = await stripe.paymentIntents.create({
    description: description,
    customer: customer.id ,
    amount: amount,
    currency: 'usd',
  });

  res
    .status(200)
    .json({ success: true, client_secret: paymentIntent.client_secret });
});

exports.sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});
