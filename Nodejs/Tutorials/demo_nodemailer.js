var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sapeksh1@gmail.com',
    pass: '***********'
  }
});

var mailOptions = {
  from: 'sapeksh1@gmail.com',
  to: 'sapeksh.gupta@mahle.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});