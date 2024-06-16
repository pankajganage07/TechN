const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

//@desc get all users
//@route GET /users
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, "-password").lean();
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

//@desc create new user
//@route POST /users
//@access private
const createNewUser = asyncHandler(async (req, res) => {
  const { username, password, roles } = req.body;

  //confirm user data
  if (!username || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  //check for duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(409).json({ message: "Username already exists" });
  }

  //hash password
  const hashpass = await bcrypt.hash(password, 10);

  //create and store new user
  const userObj = { username, password: hashpass, roles };
  const user = await User.create(userObj);

  if (user) {
    //created
    res.status(201).json({ message: `User ${username} created sucessfully` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

//@desc update user
//@route PATCH /users
//@access private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  //confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "missing message field or invalid data" });
  }

  //get user by id
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "user not found" });
  }

  //if user is found then check for duplicates username you want to update with
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();
  if (duplicate && duplicate?._id != id) {
    return res.status(409).json({ message: "duplicate username exist" });
  }

  //if duplicate username does not exist
  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updateduser = await user.save();
  res.json({ message: `updated ${updateduser.username}` });
});

//@desc delete user
//@route DELETE /users
//@access private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "id required" });
  }

  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "user has assigned notes" });
  }

  //find the user
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "user not found" });
  }

  //delete user
  const username = user.username;
  const deleteduser = await user.deleteOne();

  res.json({ message: `deleted ${username}` });
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
