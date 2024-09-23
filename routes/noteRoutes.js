const express = require("express");
const router = express.Router();
const notesController = require("../controllers/noteController");
const verifyJWT = require("../middleware/verifyJWT");

// use verifyJWT middleware for all routes
router.use(verifyJWT)

router
  .route("/")
  .get(notesController.getAllNotes)
  .post(notesController.createNewNote);

  router
  .route("/:id")
  .get(notesController.getNoteById)
  .patch(notesController.updateNote)
  .delete(notesController.deleteNote);

module.exports = router;

