import express from "express";
import Complaint from "../models/Complaint.js";
import asyncHandler from "express-async-handler";

const filterRoutes = express.Router();

const getFirstRound = asyncHandler(async (req, res) => {
  const incoming = JSON.parse(req.params.incoming);
  let currentPage = 1;
  const limit = 10;

  if (Object.values(incoming)[0] === "resN" || Object.keys(incoming)[0] === "deux") {
    if (Object.keys(incoming)[0] === "deux") {
      currentPage = Object.values(incoming)[0];
      
      const complaints = await Complaint.aggregate([
        { $match: { resolved: false } },
        { $skip: (currentPage - 1) * limit },
        { $limit: limit },
      ]);

      const totalComplaints = await Complaint.countDocuments({ resolved: false });

      console.log("Complaint Count: " + complaints.length, "/ " + totalComplaints);

      return res.status(200).json({
        iteration: 1,
        complaints,
        currentPage,
      });
    }

    const complaints = await Complaint.aggregate([
      { $match: { resolved: false } },
      { $skip: (currentPage - 1) * limit },
      { $limit: limit },
    ]);

    const totalComplaints = await Complaint.countDocuments({ resolved: false });

    console.log("Complaint Count: " + complaints.length, "/ " + totalComplaints);

    return res.status(200).json({
      iteration: 1,
      complaints,
      currentPage,
    });
  } else if (Object.values(incoming)[0] === "resY") {
  }

  return res.status(200).json({
    incoming,
    instructions: "Listen more",
  });
});

filterRoutes.route("/first-round/:incoming").get(getFirstRound);

export default filterRoutes;
