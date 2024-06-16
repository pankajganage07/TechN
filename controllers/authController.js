const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// @desc Login
// @route POST /auth
// @access public
const login = asyncHandler(async (req, res) => {
  //do stuff
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "all fields required" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res
      .status(401)
      .json({ message: "unauthorized, user marked unactive" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res
      .status(401)
      .json({ message: "unauthorized, pass does not match" });

  //create access token
  const accessToken = jwt.sign(
    {
      userInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  //create refresh token
  const refreshToken = jwt.sign(
    {
      username: foundUser.username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  //create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only through web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 1000 * 60 * 60 * 24 * 7, //cookie expires in 7 days
  });

  //send access token containing username and roles
  res.json({ accessToken });
});

// @desc refresh
// @route GET /auth/refresh
// @access public- bcoz acces tokens expired
const refresh = asyncHandler(async (req, res) => {
  //do stuff
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return res
      .status(401)
      .json({ message: "unauthorized, cookies not present" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "forbidden" });

      const foundUser = await User.findOne({ username: decoded.username });

      if (!foundUser)
        return res
          .status(401)
          .json({ message: "unauthorized, user not found" });

      const accessToken = jwt.sign(
        {
          userInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    })
  );
});

// @desc logout
// @route POST /auth/logout
// @access public - just to clear cookie if exists
const logout = (req, res) => {
  //do stuff
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //no content
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.json({ message: "cookie clearee" });
};

module.exports = {
  login,
  refresh,
  logout,
};
