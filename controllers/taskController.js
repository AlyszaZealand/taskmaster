const taskService = require("../services/taskService")



async function getAllTasks(req, res){
    try {
        const tasks = await taskService.handleGetAllTasks()
        res.json(tasks);
    } catch (err) {
        res.status(500).json({error: 'Kunne ikke læse opgaver.'})
    }
}

async function addNewTask(req, res){
    try {
        await taskService.handleAddNewTask(req)
        res.status(201).json({ message: 'Opgave tilføjet!'})
    } catch (err) {
        res.status(500).json({error: 'Kunne ikke tilføje opgave.'})
    }
}

async function deleteTask(req, res){
    try {
        await taskService.handleDeleteTask(req);
        res.status(201).json({ message: 'Opgaven blev slettet'})
    } catch {
        res.status(500).json({ error: 'Kunne ikke slette opgaven'})
    }
}

module.exports = {getAllTasks, addNewTask, deleteTask}













