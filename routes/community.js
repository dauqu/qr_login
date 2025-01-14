const express = require("express");
const router = express.Router();
const CommunitySchema = require("../schema/community_schema");
const CheckAuth = require("./../functions/check_auth");
const UsersSchema = require("./../schema/user_schema");

//Get community
router.get("/", async (req, res) => {
  try {
    const community = await CommunitySchema.find();
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve community" });
  }
});

//get community where admin is my id
router.get("/my/community", async (req, res) => {
  // Check Auth first
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  console.log(check.data._id);

  try {
    const community = await CommunitySchema.find({
      admin: check.data._id,
    });
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve community" });
  }
});

//Get community by id
router.get("/:id", async (req, res) => {
  try {
    const community = await CommunitySchema.findById(req.params.id);
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve community" });
  }
});

//Post a community
router.post("/", async (req, res) => {
  // Check Auth first
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  if (!req.body.name) {
    return res
      .status(400)
      .json({ message: "Name is required", data: null, auth: true });
  }

  if (!req.body.username) {
    return res
      .status(400)
      .json({ message: "Username is required", data: null, auth: true });
  }

  //Check if username is already taken
  // Check if username is already taken
  const username = await CommunitySchema.findOne({
    username: req.body.username,
  });

  if (username) {
    return res
      .status(400)
      .json({ message: "Username already taken", data: null, auth: true });
  }

  const community = new CommunitySchema({
    participants: [
      {
        user: check.data._id,
      },
    ],
    name: req.body.name,
    logo: req.body.logo,
    username: req.body.username,
    admin: check.data._id,
    last_message: req.body.last_message,
  });

  try {
    const savedCommunity = await community.save();
    res.json(savedCommunity);
  } catch (error) {
    res.status(500).json({ error: "Failed to save community" });
  }
});

//Add a participant
router.post("/add/participant", async (req, res) => {
  // Check Auth first
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  if (!req.body.community_id) {
    return res
      .status(400)
      .json({ message: "Community ID is required", data: null, auth: true });
  }

  if (!req.body.user_id) {
    return res
      .status(400)
      .json({ message: "User ID is required", data: null, auth: true });
  }

  // Check if community exists
  try {
    const community = await CommunitySchema.find({
      _id: req.body.community_id,
    });
    if (!community) {
      return res
        .status(404)
        .json({ message: "Community not found", data: null, auth: true });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", data: null, auth: true });
  }

  // Check if user exists
  try {
    const user = await UsersSchema.findById(req.body.user_id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", data: null, auth: true });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", data: null, auth: true });
  }

  // Check if user is already a participant
  try {
    const participant = await CommunitySchema.findOne({
      _id: req.body.community_id,
      participants: { $elemMatch: { user: req.body.user_id } },
    });
    if (participant) {
      return res.status(400).json({
        message: "User is already a participant",
        data: null,
        auth: true,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", data: null, auth: true });
  }

  // Add participant
  try {
    const participant = await CommunitySchema.findByIdAndUpdate(
      req.body.community_id,
      {
        $push: {
          participants: {
            user: req.body.user_id,
          },
        },
      },
      { new: true }
    );
    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

//Get all community where user is a participant
router.get("/my/participant", async (req, res) => {
  // Check Auth first
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }
  try {
    const community = await CommunitySchema.find({
      participants: { $elemMatch: { user: check.data._id } },
    });
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve community" });
  }
});

//Update a community
router.patch("/:id", async (req, res) => {
  try {
    const community = await CommunitySchema.findById(req.params.id);
    community.participants = req.body.participants;
    community.name = req.body.name;
    community.logo = req.body.logo;
    community.admin = req.body.admin;
    community.last_message = req.body.last_message;
    const savedCommunity = await community.save();
    res.json(savedCommunity);
  } catch (error) {
    res.status(500).json({ error: "Failed to update community" });
  }
});

//Delete a community
router.delete("/:id", async (req, res) => {
  try {
    const community = await CommunitySchema.findByIdAndDelete(req.params.id);
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete community" });
  }
});

module.exports = router;
