const axios = require('axios');

const sendAddTaskRequest = async (i) => {
    const message = `Task from client ${i}`
    const task = {
        id: crypto.randomUUID(),
        name: message
    };

    console.log(`Client ${i} sending:`, message)

    try {
        const response = await axios.post(
            'http://localhost:3000/api/tasks',
            task,
            {headers: {'Content-Type': 'application/json'}}
        );
        return {
            client: i,
            id: task.id,
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            client: i,
            id: task.id,
            success: false,
            status: error.response?.status,
            data: error.response?.data ?? error.message
        };
    }
}

async function runAddTests() {
    const beforeResponse = await axios.get('http://localhost:3000/api/tasks');
    const beforeCount = beforeResponse.data.length;
    const results = await Promise.all(
        Array.from({length: 10}, (_, i) => sendAddTaskRequest(i))
    );
    const afterResponse = await axios.get('http://localhost:3000/api/tasks');
    const persistedIds = new Set(afterResponse.data.map(task => task.id));
    const missingIds = results
        .filter(result => !persistedIds.has(result.id))
        .map(result => result.id);
    const failedRequests = results.filter(result => !result.success);

    console.log('\n--- resultater ---');
    console.table(results);
    console.log(`Tasks before: ${beforeCount}`);
    console.log(`Tasks after: ${afterResponse.data.length}`);
    console.log(`Submitted tasks persisted: ${results.length - missingIds.length}/${results.length}`);

    if (failedRequests.length > 0 || missingIds.length > 0) {
        console.error('Concurrent task creation verification failed.');
        if (missingIds.length > 0) {
            console.error('Missing task IDs:', missingIds);
        }
        process.exitCode = 1;
    } else {
        console.log('All ten submitted tasks were persisted.');
    }
}

runAddTests().catch(error => {
    console.error('Could not run the client simulation:', error.message);
    process.exitCode = 1;
});