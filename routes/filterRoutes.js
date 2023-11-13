import express from "express";
import Complaint from "../models/Complaint.js";
import asyncHandler from "express-async-handler";

const filterRoutes = express.Router();

const getFirstRound = asyncHandler(async (req, res) => {
  const incoming = JSON.parse(req.params.incoming);

  if (Object.values(incoming)[0] === "resN") {
    const complaints = await Complaint.find({ resolved: false }).limit(8);
    return res.status(200).json({
      complaintNum: complaints.length,
      complaints,
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
