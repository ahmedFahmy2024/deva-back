const express = require("express");
const router = express.Router();
const usersController = require("../controllers/userController");
const verifyJWT = require("../middleware/verifyJWT");

// use verifyJWT middleware for all routes
router.use(verifyJWT)

router
  .route("/")
  .get(usersController.getAllUsers)
  .post(usersController.createNewUser)

router.route("/:id")
.get(usersController.getUserById)
.patch(usersController.updateUser)
.delete(usersController.deleteUser);

module.exports = router;
