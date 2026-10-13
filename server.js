const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app  = express();
const taskRouter = require("./routes/taskRoutes")

const PORT = 3000;

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use("/api/tasks", taskRouter)



// Start
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})


