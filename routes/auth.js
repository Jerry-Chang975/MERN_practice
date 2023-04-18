const router = require("express").Router();
const User = require("../models").user;
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("this is about auth request");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("auth test successfully");
});

router.post("/register", async (req, res) => {
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // check email if existed
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist)
    return res.status(400).send("This email has already been registered");

  // new account
  let { username, email, password, role } = req.body;
  let newUser = new User({ username, email, password, role });
  try {
    let savedUser = await newUser.save();
    return res.send({
      msg: "user has been saved",
      savedUser,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send("some error happen");
  }
});

router.post("/login", async (req, res) => {
  // login validation
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // check user existed or not
  const foundUser = await User.findOne({ email: req.body.email }).exec();

  console.log(foundUser);

  if (!foundUser) return res.status(401).send("User not found!");

  // check password
  foundUser.comparePassword(req.body.password, (err, result) => {
    if (err) return res.status(500).send(err);

    if (result) {
      // JWT setting
      const tokenData = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenData, process.env.PASSPORT_SECRET);

      return res.send({
        msg: "login successfully",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("your password is wrong");
    }
  });

  // redirection page
});

module.exports = router;
