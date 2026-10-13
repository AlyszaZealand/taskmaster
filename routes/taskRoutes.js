const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController")

router.get("/", taskController.getAllTasks)
router.post("/", taskController.addNewTask)
router.delete("/:id", taskController.deleteTask)

module.exports = router;

















