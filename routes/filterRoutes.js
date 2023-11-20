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

const getComplaints = async (req, res) => {
  const page = parseInt(req.params.page);
  const perPage = parseInt(req.params.perPage);

  const complaints = await Complaint.find({});

  console.log(req.params.filter);

  if (req.params.filter === undefined) {
    console.log("Standard Filter Check");
    const totalPages = Math.ceil(complaints.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedComplaints = complaints.slice(startIndex, endIndex);

    //To augment...
    return res
      .status(200)
      .json({ complaints: paginatedComplaints, pagination: { currentPage: page, totalPages } });
  }

  if (req.params.filter) {
    const skip = page * perPage;

    const fCount = await Complaint.aggregate([
      { $sort: { createdAt: -1 } },
      { $count: "totalDocuments" },
    ]);

    console.log(fCount);
    //count success; returns an array of objects, one, of total document number. need to most likely reconfigure UI to use this number for up and down buttons.

    const filtered = await Complaint.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },
    ]);

    return res.status(200).json({ complaints: filtered });
  }

  //TO Delete ... below
  res.status(404).json({ message: "What?" });
};

filterRoutes.route("/first-round/:incoming").get(getFirstRound);
filterRoutes.route("/").get(getComplaints);
filterRoutes.route("/:page/:perPage").get(getComplaints);
filterRoutes.route("/:page/:perPage/:filter").get(getComplaints);

export default filterRoutes;
