const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const app  = express();
const taskRouter = require("./routes/taskRoutes")

const PORT = 3000;

app.use("/api/tasks", taskRouter)

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))



/*
// Console
app.get('/', (req, res) => {
    res.json({message: "Backend is now running"});
});

*/

// Start
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})


