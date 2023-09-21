import express from "express";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import asyncHandler from "express-async-handler";
import AppError from "../appError.js";
import { admin, protectRoute } from "../Middleware/AuthMiddleware.js";

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
      userId,
      displayName,
      title,
      occurence,
      time,
      complaintType,
      description,
      imageUrl,
      authoritiesNotified,
      resolved,
      crossStreet1,
      crossStreet2,
    } = req.body;

    const complaint = new Complaint({
      userId,
      displayName,
      title,
      occurence,
      time,
      complaintType,
      description,
      imageUrl,
      authoritiesNotified,
      resolved,
      crossStreet1,
      crossStreet2,
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
    const complaints = await Complaint.find({ userId: "64bd7065a28c926c4f5280c5" });
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

const getAllUserComplaints = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    const userComplaints = await Complaint.find({ userId });

    res.status(201).json(userComplaints);
  } catch (error) {
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

//Routes
complaintRoutes.route("/createComplaint").post(protectRoute, createComplaint);
complaintRoutes.route("/getComplaints").get(getComplaints);

complaintRoutes.route("/paginated").get(getPaginatedComplaints);
complaintRoutes.route("/getComplaint/:id").get(getComplaint);
complaintRoutes.route("/removeComplaint/:id").delete(removeComplaint);
complaintRoutes.route("/gettingusercomplaints/:id").get(getAllUserComplaints);
complaintRoutes.route("/testing").get(testingStuff);
complaintRoutes.route("/deleteAsset/:publicId").post(destoryAsset);

export default complaintRoutes;
