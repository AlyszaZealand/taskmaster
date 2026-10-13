const axios = require('axios');

const sendAddTaskRequest = async (i) => {
    const message = `Task from client ${i}`

    console.log(`Client ${i} sending:`, message)

    return axios.post(
        'http://localhost:3000/api/tasks',{
            id: crypto.randomUUID(),
            name: message},
        {headers: {'Content-Type': 'application/json'}}
    ).then(res => ({
        client: i,
        success: true,
        data: res.data
    })).catch(res => ({
        client: i,
        success: false,
        data: res.data
    }));
}

async function runAddTests() {
    const promises = [];

    for (let i = 0; i < 10; i++) {
        promises.push(sendAddTaskRequest(i));
    }

    const results = await Promise.all(promises);

    console.log("\n --- resultater ---");
    console.table(results);
}



runAddTests();