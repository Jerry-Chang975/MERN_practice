const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route recived a request");
  next();
});

router.post("/", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error);
  console.log(req.user.isStudent());
  if (req.user.isStudent()) {
    return res.status(400).send("only instructor can post new course");
  }

  let { title, description, price } = req.body;
  let newCourse = new Course({ title, description, price });
  try {
    const savedCourse = await newCourse.save();
    return res.send({
      msg: "success to create new course",
      savedCourse,
    });
  } catch (e) {
    return res.status(500).send(error);
  }
});

module.exports = router;
