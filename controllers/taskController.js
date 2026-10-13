const taskService = require("../services/taskService");

async function getAllTasks(req, res) {
    try {
        const tasks = await taskService.handleGetAllTasks();
        res.json(tasks);
    } catch (err) {
        console.error('Fejl i getAllTasks:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Kunne ikke læse opgaver.' });
    }
}

async function addNewTask(req, res) {
    try {
        const { name } = req.body || {};
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Opgavenavn er påkrævet og må ikke være tomt.' });
        }

        const newTask = await taskService.handleAddNewTask(req);
        res.status(201).json({ message: 'Opgave tilføjet!', task: newTask });
    } catch (err) {
        console.error('Fejl i addNewTask:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Kunne ikke tilføje opgave.' });
    }
}

async function deleteTask(req, res) {
    try {
        const { id } = req.params || {};
        if (!id || typeof id !== 'string' || !id.trim()) {
            return res.status(400).json({ error: 'Opgave-ID mangler eller er ugyldigt.' });
        }

        await taskService.handleDeleteTask(req);
        res.status(200).json({ message: 'Opgaven blev slettet' });
    } catch (err) {
        console.error('Fejl i deleteTask:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Kunne ikke slette opgaven.' });
    }
}

module.exports = { getAllTasks, addNewTask, deleteTask };













