const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("course route recived a request");
  next();
});

router.get("/", async (req, res) => {
  try {
    const allCourse = await Course.find({})
      .populate("instructor", ["username", "email"])
      .exec();
    if (allCourse) {
      return res.send(allCourse);
    } else {
      return res.status(404).send("course not found");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

// get by course id
router.get("/:_id", async (req, res) => {
  try {
    let { _id } = req.params;
    const courseFound = await Course.findOne({ _id })
      .populate("instructor", ["username", "email"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

// get course by instructor id
router.get("/instructor/:_instructor_id", async (req, res) => {
  let { _instructor_id } = req.params;
  let coursesFound = await Course.find({
    instructor: _instructor_id,
  })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

// get course by student id
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let courseFound = await Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(courseFound);
});

// get course by name
router.get("/search/:_course_name", async (req, res) => {
  let { _course_name } = req.params;
  let coursesFound = await Course.find({ title: _course_name })
    .populate("instructor", ["username", "email"])
    .exec();
  return res.send(coursesFound);
});

// student enrolls course by id
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id });
    courseFound.students.push(req.user._id);
    let result = await courseFound.save();
    return res.send(result);
  } catch (e) {
    return res.send(e);
  }

  return;
});

// post new course
router.post("/", async (req, res) => {
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error);
  console.log(req.user.isStudent());
  if (req.user.isStudent()) {
    return res.status(400).send("only instructor can post new course");
  }

  let { title, description, price } = req.body;
  let newCourse = new Course({
    title,
    description,
    price,
    instructor: req.user.id,
  });
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

// revise course contents
router.patch("/:_id", async (req, res) => {
  // validation
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error);

  let { _id } = req.params;
  // check instructor
  try {
    let foundCourse = await Course.findOne({ _id }).exec();
    if (!foundCourse) {
      return res.status(404).send("can not find course");
    }
    if (foundCourse.instructor.equals(req.user._id)) {
      let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidations: true,
      }).populate("instructor", ["username", "email"]);
      return res.send({ msg: "update successfully", updatedCourse });
    } else {
      return res.status(403).send("you have to be an instructor");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

// delete course
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    // find course
    let foundCourse = await Course.findOne({ _id }).exec();
    if (!foundCourse) {
      return res.status(404).send("can not find course");
    }
    if (foundCourse.instructor.equals(req.user._id)) {
      await Course.findOneAndDelete({ _id });
      return res.send({ msg: "delete successfully" });
    } else {
      return res.status(403).send("You have to be an owner of this course");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
