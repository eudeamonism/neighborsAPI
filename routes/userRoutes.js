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

const genToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, { expiresIn: "15m" });
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
    console.log(error);
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
        token: genToken(user._id, user.isAdmin, user.isGuide),
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//Login with Administrator Priveleges
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const complaint = await Complaint.find({ userId: user._id });

  if (await bcrypt.compare(password, user.password)) {
    const token = genToken(user._id, user.isAdmin, user.isGuide);

    user.numberOfComplaints = complaint.length;
    user.save();

    res.json({
      token,
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
    console.log(error);
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

    console.log(updatedUser);
    return res.status(201).json("login");
  } catch (error) {
    console.log(error);
    return res.status(201).json("error");
  }
});

//Routes
userRoutes.route("/login").post(loginUser);
userRoutes.route("/forgotPassword/:email").get(forgotPassword);
userRoutes.route("/register").post(registerUser);
userRoutes.route("/decrementComplaint/:id").post(decrementComplaint);
userRoutes.route("/resetUserId/:id").get(resetUserId);
userRoutes.route("/matchotp/:entry/:email").get(matching);
userRoutes.route("/resetPassword/:password/:email").put(updatePassword);

export default userRoutes;
