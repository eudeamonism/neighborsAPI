import express from "express";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { protectRoute } from "../Middleware/AuthMiddleware.js";
import otpGenerator from "otp-generator";

const userRoutes = express.Router();

const expToNorm = (tokenExpiry) => {
  const date = new Date(tokenExpiry * 1000);

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);

  return formattedDate;
};

const genToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, { expiresIn: "15m" });
};
const refToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, { expiresIn: "24h" });
};

const userStuff = process.env.USEREMAIL;
const passStuff = process.env.STMPPASS;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userStuff,
    pass: passStuff,
  },
});

const fourNumbers = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false });

async function main(useremail, htmlLink) {
  const info = await transporter.sendMail({
    from: '"Neighbors Administrator" <eudeamonism@gmail.com>',
    to: useremail,
    subject: "Reset Neighbors Password",
    text: `Here's your four character reset for your password ${fourNumbers}`,
    html: htmlLink,
  });
  console.log("Message sent: %s", info.messageId);
}

async function main2(useremail) {
  const info = await transporter.sendMail({
    from: '"Neighbors Administrator" <eudeamonism@gmail.com>',
    to: useremail,
    subject: "False Attempt to reset your password",
    text: "Someone tried to reset your password but was rejected!",
  });
  console.log("Message sent: %s", info.messageId);
}

const decryptGmailToken = asyncHandler(async (req, res) => {
  const body = req.body.headers;
  const { clientId, credential } = body;

  const decodedToken = jwt.decode(credential);

  if (
    decodedToken.aud !== process.env.GMAIL_CLIENT_ID &&
    decodedToken.iss !== "https://accounts.google.com"
  ) {
    return res.status(403);
  }

  try {
    const email = decodedToken.email;

    const user = await User.findOne({ email });

    if (user === null) {
      return res.status(404).json({ message: "Account not found!" });
    }

    const id = user._id.toString();

    const token = genToken(id);
    const refresh = refToken(id);

    return res.status(200).json({ token, refresh });
  } catch (error) {
    console.log("GMToken " + error);
  }
});

const sendProfile = asyncHandler(async (req, res) => {
  try {
    const token = req.params.token;
    const refresh = req.params.refresh;

    const parsedToken = jwt.verify(token, process.env.TOKEN_SECRET, function (err, res) {
      if (err) {
        console.log("Error in callback of jwt:  token " + err);
      } else {
        return res;
      }
    });

    

    const parsedRefresh = jwt.verify(refresh, process.env.TOKEN_SECRET, function (err, res) {
      if (err) {
        console.log("Error in callback of jwt: refresh " + err);
      } else {
        return res;
      }
    });

    if (parsedToken !== undefined) {
      const user = await User.findById(parsedToken.id);

      return res.status(401).json(user);
    } else if (parsedRefresh !== undefined) {
      const user = await User.findById(parsedRefresh.id);

      return res.status(401).json(user);
    } else {
      return console.log("Both tokens are expired! Ends here!");
    }
  } catch (error) {
    console.log("SEND Profile " + error);

    return res.status(401).json("expired");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const email = req.params.email;

    const user = await User.findOne({ email });

    if (user) {
      if (user.tries >= 4) {
        console.log(`More than four. Attempts are: ${user.tries}`);
        user.lockoutTime = Date.now() + 60000;
        user.tries = 0;
        user.otp = null;
        user.save();
      }

      if (user.lockoutTime && user.lockoutTime > Date.now()) {
        return res.status(201).json({ stat: "locked" });
      }

      main(email);

      const salt = await bcrypt.genSalt(10);

      user.tries++;
      user.otp = await bcrypt.hash(fourNumbers, salt);

      user.save();

      res.status(201).json({ stat: "true", email: user.email });
    } else {
      res.status(201).json({ stat: "notfound" });
    }
  } catch (error) {
    console.log("forgot password " + error);
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, displayName, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log("User already exists");
      res.status(400).send("We already have an account with that email address.");
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      displayName,
    });

    if (user) {
      res.status(201).json({
        token: genToken(user._id.toString()),
        refresh: refToken(user._id.toString()),
      });
    }
  } catch (error) {
    console.log("registerUser " + error);
  }
});

//Login with Administrator Priveleges
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const complaint = await Complaint.find({ userId: user._id });

  if (await bcrypt.compare(password, user.password)) {
    const token = genToken(user._id.toString());
    const refresh = refToken(user._id.toString());

    user.numberOfComplaints = complaint.length;
    user.save();

    res.json({
      refresh: refresh,
      token: token,
    });
  } else {
    res.json(401).send("Invalid Email or Password");
    throw new Error("Invalid Email or Password");
  }
});

const decrementComplaint = asyncHandler(async (req, res) => {
  try {
    //:id
    const user = await User.findById(req.params.id);

    user.numberOfComplaints -= 1;

    user.save();

    res.status(201).send("Complaint removed");
  } catch (error) {
    res.status(404).send(error.message);
  }
});

/* const counter = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  res.status(200).json(user.numberOfComplaints -=1);
}); */

const resetUserId = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.status(200).json(user);
});

const matching = asyncHandler(async (req, res) => {
  console.log("Inside");
  try {
    const entry = req.params.entry;
    const email = req.params.email;

    const user = await User.findOne({ email });

    //Returns Boolean
    const result = await bcrypt.compare(entry, user.otp);

    if (result === true) {
      console.log("Success!");

      return res.status(201).json({ stat: "change", email: user.email });
    } else if (result === false) {
      console.log("Forbidden Access!");
      main2(email);
      return res.status(201).json(false);
    } else {
      console.log("ERROR! Try again later!");
      return res.status(201).json("error");
    }
  } catch (error) {
    console.log("matching " + error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  try {
    const email = req.params.email;
    const password = req.params.password;

    const user = await User.findOne({ email });

    /* const salt = await bcrypt.genSalt(10); */

    /* user.password = await bcrypt.hash(password, salt); */

    user.password = password;
    const updatedUser = await user.save();

    console.log("updatedUser pl " + updatedUser);
    return res.status(201).json("login");
  } catch (error) {
    console.log("update user error " + error);
    return res.status(201).json("error");
  }
});

//Routes
userRoutes.route("/gmailverify").post(decryptGmailToken);
userRoutes.route("/login").post(loginUser);
userRoutes.route("/profile/:token/:refresh").get(sendProfile);
userRoutes.route("/forgotPassword/:email").get(forgotPassword);
userRoutes.route("/register").post(registerUser);
userRoutes.route("/decrementComplaint/:id").post(decrementComplaint);
userRoutes.route("/resetUserId/:id").get(resetUserId);
userRoutes.route("/matchotp/:entry/:email").get(matching);
userRoutes.route("/resetPassword/:password/:email").put(updatePassword);

export default userRoutes;
