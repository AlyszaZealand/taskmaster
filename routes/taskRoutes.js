const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController")

router.get("/api/tasks", taskController.getAllTasks)
router.post("/api/tasks", taskController.addNewTask)
router.delete("/api/tasks/:id", taskController.deleteTask)

module.exports = router;

















