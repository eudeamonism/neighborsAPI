import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const protectRoute = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (token == null) {
        return res.sendStatus(401);
      }

      jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
		if (err) return res.sendStatus(403);

		req.user = user;

		console.log(req.user);
		next();
	  });
     
      next();
    } catch (error) {
      res.status(401);
      //The ability to throw this error comes from the asyncHandler package
      throw new Error("Not authorized, token failed.");
    }
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin !== "false") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin.");
  }
};
const guide = (req, res, next) => {
  if (req.user && req.user.isGuide !== "false") {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an guide.");
  }
};

export { protectRoute, admin, guide };
