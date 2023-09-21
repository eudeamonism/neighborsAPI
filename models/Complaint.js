import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    displayName: { type: String, ref: "User" },
    title: {
      type: String,
      required: true,
      maxLength: [40, "Title cannot be more than 40 characters"],
    },
    occurence: { type: Date, required: true },
    time: {
      type: String,
      required: true,
    },
    complaintType: {
      type: Array,
      of: String,
      default: [
        "Illegal Dumping",
        "Excessive Noise",
        "Lewdness",
        "Public Intoxication",
        "Creeping",
        "Stalking",
        "Violence",
        "Theft",
        "Speeding",
        "Drugs",
        "Tenant Issues",
        "Abandoned Vehicles",
        "Fireworks",
        "Discrimination",
        "Unsanitary Conditions",
        "Public Nuisance",
        "Code Violations",
        "Salty",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      validate: function (description) {
        return description && description.length >= 20 && description.length <= 200;
      },
      message: "Description must be at least 20 characters but no more than 200 characters",
    },
    imageUrl: {
      type: String,
      maxLength: [300, "Url cannot be more than 300 characters"],
      default: null,
    },
    authoritiesNotified: { type: Boolean, default: false, required: true },
    resolved: { type: Boolean, default: false, required: true },
    crossStreet1: {
      type: String,
      required: true,
      maxLength: [80, "Street cannot be more than 60 characters"],
    },
    crossStreet2: {
      type: String,
      maxLength: [80, "Street cannot be more than 60 characters"],
      default: null,
    },
  },
  { timestamps: true }
);

complaintSchema.plugin(mongoosePaginate);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
