const mongoose = require("mongoose");

// Schema
const CommunitySchema = new mongoose.Schema(
  {
    participants: {
      default: [],
      type: Array,
      required: true,
      ref: "users",
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default:
        "https://cdn1.iconfinder.com/data/icons/avatar-97/32/avatar-02-512.png",
    },
    admin: {
      type: String,
      required: true,
      ref: "users",
    },
    about: {
      type: String,
      default: "",
    },
    last_message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("community", CommunitySchema);
