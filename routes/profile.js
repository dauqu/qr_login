const express = require("express");
const router = express.Router();
const UsersSchema = require("./../schema/user_schema");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const CheckAuth = require("./../functions/check_auth");

//Get Profile
router.get("/", async (req, res) => {
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  } else {
    return res
      .status(200)
      .json({ message: "Authorized", auth: true, data: check.data });
  }
});

// Get Profile
router.get("/:id", async (req, res) => {
  // const check = await CheckAuth(req, res);

  try {
    // Assuming you have a database or some data source where profiles are stored
    const profileId = req.params.id; // Get the profile ID from the route parameter
    const profile = await UsersSchema.findById(profileId); // Assuming you have a "Profile" model or data access object

    if (!profile) {
      return res
        .status(404)
        .json({ message: "Profile not found", data: null, auth: true });
    }

    return res
      .status(200)
      .json({ message: "Authorized", data: profile, auth: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", data: null, auth: true });
  }
});

//Update Profile
router.post("/", async (req, res) => {
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  //CHeck if file is not uploaded
  if (!req.files) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  //Get file
  const file = req.files.dp;

  //Rename file
  const fileName = `${Date.now()}-${file.name}`;

  //Move file to public folder
  file.mv(`./files/${fileName}`, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  //Find by id and upadte user
  const user = await UsersSchema.findById(check.data._id);
  if (user) {
    user.full_name = req.body.full_name;
    user.dp = fileName;
    user.title = req.body.title;
    user.about = req.body.about;
    user.phone = req.body.phone;
    user.username = req.body.username;
    user.email = req.body.email;
    user.language = req.body.language;
    user.country_name = req.body.country_name;
    user.code = req.body.code;
    user.dial_code = req.body.dial_code;
    user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } else {
    return res.status(404).json({ message: "User not found" });
  }
});

//Update Profile
router.patch("/", async (req, res) => {
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, ""); // Trim leading/trailing white space
    str = str.toLowerCase(); // Convert to lowercase
    str = str
      .replace(/[^a-z0-9 .-]/g, "") // Remove non-alphanumeric characters except dots, spaces, and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove consecutive hyphens
    return str;
  }

  //Get file
  const file = req.files?.dp;

  //Rename file
  if (file && file != null && file != undefined && file != "") {
    var fileName = `${Date.now()}-${file.name}`;

    const slug = slugify(fileName);

    file.mv(`./files/${slug}`, async (err) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
    });

    try {
      var fileUrl = await uploadFileToS3(slug, slug);
      console.log(fileUrl);
    } catch (error) {
      console.error("Error:", err);
    }
  }

  // validation for check all fields are filled
  const { full_name, phone, email, username } = req.body;
  if (!full_name || !phone || !email || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //Find by id and upadte user
  const user = await UsersSchema.findById(check.data._id);
  if (user) {
    user.full_name = req.body.full_name;
    //CHeck if file is not uploaded
    if (file) {
      user.dp = fileUrl;
    }
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(req.body.password, salt);
      user.password = hash;
    }
    if (req.body.title) {
      user.title = req.body.title;
    }
    if (req.body.about) {
      user.about = req.body.about;
    }
    if (req.body.phone) {
      user.phone = req.body.phone;
    }
    if (req.body.username) {
      user.username = req.body.username;
    }
    if (req.body.email) {
      user.email = req.body.email;
    }
    if (req.body.language) {
      user.language = req.body.language;
    }
    if (req.body.country_name) {
      user.country_name = req.body.country_name;
    }
    if (req.body.code) {
      user.code = req.body.code;
    }
    if (req.body.dial_code) {
      user.dial_code = req.body.dial_code;
    }
    if (req.body.age) {
      user.age = req.body.age;
    }
    user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } else {
    return res.status(404).json({ message: "User not found" });
  }
});

//Update password
router.post("/update-password", async (req, res) => {
  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  //Compare passwords bcrypt
  if (!bcrypt.compareSync(req.body.password, check.data.password)) {
    return res.status(400).json({ message: "Wrong password" });
  }

  //Hash new password
  const hashed_password = await bcrypt.hash(req.body.password, 10);

  //Find by id and upadte user
  const user = await UsersSchema.findById(check.data._id);
  if (user) {
    user.password = hashed_password;
    user.save();
    return res.status(200).json({
      message: "Password updated successfully",
    });
  } else {
    return res.status(404).json({ message: "User not found" });
  }
});

router.post("/reset-password", async (req, res) => {});

//Verify email
router.get("/verify-email/:uuid", async (req, res) => {
  //Get uuid
  const uuid = req.params.uuid;

  const check = await CheckAuth(req, res);
  if (check.auth === false) {
    return res
      .status(401)
      .json({ message: "Unauthorized", data: null, auth: false });
  }

  //Match UUID
  if (uuid !== check.data.rpt) {
    return res.status(400).json({ message: "Invalid link" });
  }
});

//Verify phone
router.post("/verify", async (req, res) => {
  const { phone } = req.body;
});

module.exports = router;
