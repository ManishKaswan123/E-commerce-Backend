// const nodeMailer = require("nodemailer");

// const sendEmail = async (options) => {
//   const transporter = nodeMailer.createTransport({
//     host: process.env.SMPT_HOST,
//     port: process.env.SMPT_PORT,
//     service: process.env.SMPT_SERVICE,
//     auth: {
//       user: process.env.SMPT_MAIL,
//       pass: process.env.SMPT_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.SMPT_MAIL,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

// sendMail("signup", user);
const nodemailer = require("nodemailer");

const sendMail = async(str , data) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "manishkaswan88@gmail.com",
          pass: "xnnsfgcilvqarymq",
        },
      });
      
    var Osubject,Otext,Ohtml;

    if(str == "signup") {
        Osubject = `Thank You for signing Up`;
        Ohtml = `
        <h1>Welcome to FoodApp.com</h1>
        Hope you have a good time!
        Here are your details-
        Email:- ${data.email}
        `
    }
    else if(str == "forgotPassword") {
        Osubject = `${data.subject}`;
        Ohtml = `
        <h1> FoodApp.com</h1>
        ${data.message}
        `
    }

    const info = await transporter.sendMail({
        from: '"FoodApp" <manishkaswan88@gmail.com>',
        to: data.email, 
        subject: Osubject,  
        html: Ohtml, 
    });
    
    console.log("Message sent: %s", info.messageId); 
    console.log(Osubject);     
};

module.exports = sendMail;