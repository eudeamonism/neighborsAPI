import express from "express";
import { v2 as cloudinary } from "cloudinary";

import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import asyncHandler from "express-async-handler";
import AppError from "../appError.js";

const complaintRoutes = express.Router();

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const createComplaint = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      occurence,
      street,
      cross,
      complaintType,
      description,
      imageUrl,
      authorities,
      resolved,
      time,
      token,
      refresh,
    } = req.body;

    const decodeToken = jwt.decode(token);

    const id = decodeToken.id;

    const user = await User.findById(id);

    const displayName = user.displayName;
    user.numberOfComplaints++;

    if (user.numberOfComplaints > 50) {
      user.isGuide === true;
    } else {
      user.isGuide === false;
    }
    user.save();

    const complaint = new Complaint({
      userId: id,
      displayName,
      title,
      occurence,
      time,
      complaintType,
      description,
      imageUrl,
      authoritiesNotified: authorities,
      resolved,
      crossStreet1: street,
      crossStreet2: cross,
    });

    await complaint.save();

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json(error);
  }
});

const getComplaints = asyncHandler(async (req, res) => {
  try {
    const complaints = await Complaint.find();

    res.status(201).json(complaints);
  } catch (error) {
    throw new AppError("Something went wrong retrieving complaints.");
  }
});

const testingStuff = asyncHandler(async (req, res) => {
  try {
    const filter = {
      resolved: false,
    };
    const sort = {
      createdAt: -1,
    };

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).skip(3).limit(1);
    console.log(complaints.length);

    res.status(201).json(complaints);
  } catch (error) {
    throw new AppError(
      `Something went wrong retrieving most recent complaints. ERROR => ${error} Error Message => ${error.message}`
    );
  }
});

const removeComplaint = asyncHandler(async (req, res) => {
  try {
    const complaintInformation = await Complaint.findById(req.params.id);

    const userId = complaintInformation.userId;

    const user = await User.findById(userId);

    user.numberOfComplaints--;

    user.save();

    const complaint = await Complaint.findByIdAndDelete(req.params.id);

    res.json(complaint);
  } catch (error) {
    throw new AppError(`Something went wrong getting complaints. Error: ${error}`, 404);
  }
});

const getComplaint = asyncHandler(async (req, res) => {
  try {
    const complaintId = req.params.id;

    const complaint = await Complaint.findById(complaintId);

    res.status(201).json(complaint);
  } catch (error) {
    throw new AppError(`Something went wrong getting complaint. Error: ${error}`, 404);
  }
});

const customGetComplaint = asyncHandler(async (req, res) => {
  try {
    const choice = req.params.choice;

    if (choice === "desc") {
      const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(4);
      return res.status(200).json({ length: complaints.length, complaints: complaints });
    }
    if (choice === "asc") {
      const complaints = await Complaint.find().sort({ createdAt: 1 }).limit(4);
      return res.status(200).json({ length: complaints.length, complaints: complaints });
    }
    if (choice === "resY") {
      return res.status(200).json({ message: "resY OK" });
    }
    if (choice === "resN") {
      return res.status(200).json({ message: "resN OK" });
    }

    const complaints = await Complaint.find().sort({ createdAt: -1 }).skip(3).limit(1);

    res.status(201).json(complaints);
  } catch (error) {
    throw new AppError(
      `Something went wrong retrieving most recent complaints. ERROR => ${error} Error Message => ${error.message}`
    );
  }
});

const getAllUserComplaints = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    const userComplaints = await Complaint.find({ userId });

    res.status(201).json(userComplaints);
  } catch (error) {
    console.log("Hello!");
    throw new AppError(`Something went wrong getting`, 404);
  }
});

const getPaginatedComplaints = asyncHandler(async (req, res) => {
  try {
    const complaints = await Complaint.paginate(
      {},
      {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
      }
    );

    res.status(200).json(complaints);
  } catch (error) {
    throw new AppError(`Paginating complaints went wrong`, 404);
  }
});
//
const destoryAsset = asyncHandler(async (req, res) => {
  try {
    const publicId = req.params.publicId;

    const deleteResult = await cloudinary.api.delete_resources([publicId], {
      type: "upload",
      resource_type: "image",
    });

    res.status(200).json(deleteResult);
  } catch (error) {
    throw new AppError(
      `Something went wrong destroying an asset. ERROR => ${error} Error Message => ${error.message}`
    );
  }
});

const getMyComplaintsFromDB = asyncHandler(async (req, res) => {
  const authorization = req.headers.authorization;

  const headers = authorization.split(",");

  const tokenSplit = headers[0].split(" ");

  const token = tokenSplit[1];

  const refreshSplit = headers[1].split(" ");

  const refresh = refreshSplit[2];

  try {
    const tokenVerify = jwt.verify(token, process.env.TOKEN_SECRET, function (error, result) {
      if (error) {
        return "expired";
      } else {
        return result;
      }
    });

    const refreshVerify = jwt.verify(refresh, process.env.TOKEN_SECRET, function (error, result) {
      if (error) {
        return "expired";
      } else {
        return result;
      }
    });

    //NEED ALL CASE CODE COMPLETED -- ONLY COMPLETED, PERHAPS, FOR REFRESH TOKEN BUT NOT TOKEN CASE

    if (tokenVerify !== "expired") {
      const complaints = await Complaint.find({
        userId: tokenVerify.id,
      })

        .sort({ createdAt: 1 })
        .exec();

      return res.status(201).json(complaints);
    } else if (refreshVerify !== "expired") {
      const complaints = await Complaint.find({
        userId: refreshVerify.id,
      })

        .sort({ createdAt: 1 })
        .exec();

      return res.status(201).json(complaints);
    } else {
      return res.status(404).json("Not Found!");
    }
  } catch (error) {
    console.log("My Complaints Error " + error);
  }
});

//Routes
complaintRoutes.route("/filter/:choice").get(customGetComplaint);
complaintRoutes.route("/myComplaints").get(getMyComplaintsFromDB);
complaintRoutes.route("/createComplaint").post(createComplaint);
complaintRoutes.route("/getComplaints").get(getComplaints);

complaintRoutes.route("/paginated").get(getPaginatedComplaints);
complaintRoutes.route("/getComplaint/:id").get(getComplaint);
complaintRoutes.route("/removeComplaint/:id").delete(removeComplaint);
complaintRoutes.route("/gettingusercomplaints/:id").get(getAllUserComplaints);
complaintRoutes.route("/testing").get(testingStuff);
complaintRoutes.route("/deleteAsset/:publicId").post(destoryAsset);

export default complaintRoutes;
