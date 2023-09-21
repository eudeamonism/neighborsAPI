import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    isSaving: { type: "boolean", default: false },
    firstName: {
      type: String,
      required: true,
      maxLength: [60, "Cannot be more than 60 characters"],
    },
    lastName: {
      type: String,
      required: true,
      maxLength: [60, "Cannot be more than 60 characters"],
    },
    displayName: {
      type: String,
      required: true,
      maxLength: [30, "Cannot be more than 30 characters"],
      unique: [true, "Name is already taken"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (email) {
          return /^\w+@[a-zA-Z0-9._]+\.[a-zA-Z]{2,6}$/.test(email);
        },
        message: "Invalid email address",
      },
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      default: null,
    },

    tries: {
      type: Number,
      default: 0,
    },

    lockoutTime: {
      type: Date,
      default: null,
    },
    isAdmin: { type: Boolean, type: String, default: false },
    isGuide: { type: Boolean, type: String, default: false },
    numberOfComplaints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPasswords = async function (enteredPassword) {
  console.log("validating password");
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* userSchema.pre("save", async function (next) {
  if (this.isSaving) {
    return next();
  }
  this.isSaving = true;
  this.tries++;
  if (this.tries === 4) {
    this.lockoutTime = Date.now() + 60000;
  }

  next();
}); */

/* userSchema.post("save", async function (next) {
  if (this.lockoutTime < Date.now()) {
    this.tries = 0;
    this.isSaving = false;
    await this.save();
  }
  next();
}); */

const User = mongoose.model("User", userSchema);

export default User;
