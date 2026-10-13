/**
 * Multi-user load & concurrency simulation for Taskmaster API using Axios.
 * 
 * Simulerer flere samtidige brugere, der:
 * 1. Opretter opgaver (POST /api/tasks)
 * 2. Henter opgaver (GET /api/tasks)
 * 3. Tester fejlhåndtering for ugyldigt input (POST /api/tasks med tomt navn -> forventer 400)
 * 4. Tester fejlhåndtering for ukendt ID (DELETE /api/tasks/:id -> forventer 404)
 * 5. Sletter oprettede opgaver (DELETE /api/tasks/:id -> forventer 200)
 * 
 * Kørsel:
 *   1. Sørg for at have axios installeret: npm install axios
 *   2. Start serveren i en terminal: node server.js
 *   3. Kør denne simulering: node simulate.js (eller: npm run simulate)
 */

let axios;
try {
    axios = require('axios');
} catch (e) {
    console.error('\n❌ Fejl: Modulet "axios" er ikke installeret.');
    console.error('Kør venligst følgende kommando i terminalen:');
    console.error('   npm install axios\n');
    process.exit(1);
}

// Konfiguration
const CONFIG = {
    baseURL: process.env.BASE_URL || 'http://localhost:3000/api/tasks',
    numUsers: parseInt(process.env.USERS_COUNT, 10) || 5,          // Antal samtidige brugere
    tasksPerUser: parseInt(process.env.TASKS_PER_USER, 10) || 3,   // Opgaver pr. bruger
    delayMs: parseInt(process.env.DELAY_MS, 10) || 120             // Forsinkelse mellem handlinger
};

// Statistik opsamling
const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    expectedErrorTests: 0,
    unexpectedErrors: 0,
    latencies: []
};

// Hjælpefunktion til forsinkelse med lidt tilfældig variation (jitter)
function sleep(ms) {
    const jitter = Math.floor(Math.random() * 50);
    return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

// Wrapper til axios måling
async function measureRequest(requestFn) {
    const start = Date.now();
    stats.totalRequests++;
    try {
        const response = await requestFn();
        const duration = Date.now() - start;
        stats.latencies.push(duration);
        return { response, duration, error: null };
    } catch (err) {
        const duration = Date.now() - start;
        stats.latencies.push(duration);
        return { response: err.response || null, duration, error: err };
    }
}

/**
 * Simulerer en enkelt brugers adfærd
 */
async function simulateUser(userId) {
    console.log(`👤 [Bruger ${userId}] forbinder...`);
    const createdTaskIds = [];

    // 1. OPRET OPgaver (POST)
    for (let i = 1; i <= CONFIG.tasksPerUser; i++) {
        await sleep(CONFIG.delayMs);
        const taskName = `Opgave fra Bruger ${userId} (#${i}) - ${new Date().toLocaleTimeString()}`;

        const { response, duration, error } = await measureRequest(() =>
            axios.post(CONFIG.baseURL, { name: taskName })
        );

        if (!error && (response?.status === 200 || response?.status === 201)) {
            stats.successfulRequests++;
            const taskId = response.data?.task?.id;
            if (taskId) {
                createdTaskIds.push(taskId);
            }
            console.log(`  ✅ [Bruger ${userId}] Oprettede opgave #${i} (${duration}ms)`);
        } else {
            stats.unexpectedErrors++;
            console.error(`  ❌ [Bruger ${userId}] Fejl under POST: ${error?.message || response?.status}`);
        }
    }

    // 2. HENT OPGAVER (GET)
    await sleep(CONFIG.delayMs);
    const { response: getRes, duration: getDur, error: getErr } = await measureRequest(() =>
        axios.get(CONFIG.baseURL)
    );

    if (!getErr && getRes?.status === 200 && Array.isArray(getRes.data)) {
        stats.successfulRequests++;
        console.log(`  📥 [Bruger ${userId}] Hentede ${getRes.data.length} opgaver (${getDur}ms)`);
    } else {
        stats.unexpectedErrors++;
        console.error(`  ❌ [Bruger ${userId}] Fejl under GET: ${getErr?.message || getRes?.status}`);
    }

    // 3. TEST FEJLHÅNDTERING: Tomt opgavenavn (POST med fejl -> forventer 400 Bad Request)
    await sleep(CONFIG.delayMs);
    const { response: badPostRes, duration: badPostDur, error: badPostErr } = await measureRequest(() =>
        axios.post(CONFIG.baseURL, { name: '   ' })
    );

    if (badPostRes?.status === 400) {
        stats.expectedErrorTests++;
        console.log(`  🛡️  [Bruger ${userId}] Test 400 Bad Request bestået (${badPostRes.data?.error}) [${badPostDur}ms]`);
    } else {
        stats.unexpectedErrors++;
        console.error(`  ❌ [Bruger ${userId}] Forventede 400, men modtog: ${badPostRes?.status || badPostErr?.message}`);
    }

    // 4. TEST FEJLHÅNDTERING: Slet ukendt ID (DELETE med ugyldigt ID -> forventer 404 Not Found)
    await sleep(CONFIG.delayMs);
    const fakeId = `fake-id-${userId}-${Date.now()}`;
    const { response: notFoundRes, duration: notFoundDur, error: notFoundErr } = await measureRequest(() =>
        axios.delete(`${CONFIG.baseURL}/${fakeId}`)
    );

    if (notFoundRes?.status === 404) {
        stats.expectedErrorTests++;
        console.log(`  🛡️  [Bruger ${userId}] Test 404 Not Found bestået (${notFoundRes.data?.error}) [${notFoundDur}ms]`);
    } else {
        stats.unexpectedErrors++;
        console.error(`  ❌ [Bruger ${userId}] Forventede 404, men modtog: ${notFoundRes?.status || notFoundErr?.message}`);
    }

    // 5. SLET EN OPGAVE (DELETE)
    if (createdTaskIds.length > 0) {
        await sleep(CONFIG.delayMs);
        const taskToDelete = createdTaskIds[0];
        const { response: delRes, duration: delDur, error: delErr } = await measureRequest(() =>
            axios.delete(`${CONFIG.baseURL}/${taskToDelete}`)
        );

        if (!delErr && (delRes?.status === 200 || delRes?.status === 204)) {
            stats.successfulRequests++;
            console.log(`  🗑️  [Bruger ${userId}] Slettede opgave ${taskToDelete.slice(0, 8)}... (${delDur}ms)`);
        } else {
            stats.unexpectedErrors++;
            console.error(`  ❌ [Bruger ${userId}] Fejl under DELETE: ${delErr?.message || delRes?.status}`);
        }
    }

    console.log(`🏁 [Bruger ${userId}] Færdiggjorde sine handlinger.`);
}

/**
 * Hovedfunktion: Kører alle simulerede brugere samtidigt
 */
async function runSimulation() {
    console.log('=====================================================');
    console.log('🚀 TASKMASTER MULTI-USER SIMULATION (AXIOS)');
    console.log('=====================================================');
    console.log(`Endpoint:        ${CONFIG.baseURL}`);
    console.log(`Antal brugere:   ${CONFIG.numUsers}`);
    console.log(`Opgaver/bruger:  ${CONFIG.tasksPerUser}`);
    console.log('-----------------------------------------------------\n');

    // 1. Tjek om serveren kører før start
    try {
        console.log('🔍 Forbinder til serveren...');
        await axios.get(CONFIG.baseURL, { timeout: 3000 });
        console.log('🟢 Serveren er tilgængelig og svarer!\n');
    } catch (err) {
        console.error('\n❌ KUNNE IKKE FORBINDE TIL SERVEREN!');
        console.error(`Tjek venligst om serveren kører på ${CONFIG.baseURL}`);
        console.error('Start serveren i en anden terminal med kommandoen:');
        console.error('   node server.js\n');
        process.exit(1);
    }

    const startTime = Date.now();

    // 2. Start alle brugere samtidigt med Promise.all
    const userPromises = [];
    for (let i = 1; i <= CONFIG.numUsers; i++) {
        userPromises.push(simulateUser(i));
    }

    console.log(`⚡ Kører ${CONFIG.numUsers} brugere parallelt...\n`);
    await Promise.allSettled(userPromises);

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 3. Afsluttende kontrol af databasen
    let finalTaskCount = 'Ukendt';
    try {
        const finalCheck = await axios.get(CONFIG.baseURL);
        finalTaskCount = Array.isArray(finalCheck.data) ? finalCheck.data.length : 'Ukendt';
    } catch (_) {}

    // 4. Udregn statistik
    const avgLatency = stats.latencies.length > 0
        ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
        : 0;
    const minLatency = stats.latencies.length > 0 ? Math.min(...stats.latencies) : 0;
    const maxLatency = stats.latencies.length > 0 ? Math.max(...stats.latencies) : 0;

    console.log('\n=====================================================');
    console.log('📊 SIMULATIONSRAPPORT');
    console.log('=====================================================');
    console.log(`Samlet varighed:           ${totalDuration} sekunder`);
    console.log(`Samlet antal forespørgsler:${stats.totalRequests}`);
    console.log(`Succesfulde anmodninger:   ${stats.successfulRequests}`);
    console.log(`Forventede fejltest (4xx): ${stats.expectedErrorTests}`);
    console.log(`Uventede fejl:             ${stats.unexpectedErrors}`);
    console.log(`Latency (min / gns / max): ${minLatency}ms / ${avgLatency}ms / ${maxLatency}ms`);
    console.log(`Antal opgaver i DB efter:  ${finalTaskCount}`);
    console.log('=====================================================');

    if (stats.unexpectedErrors === 0) {
        console.log('🎉 RESULTAT: Alle multi-user tests og fejlhåndtering bestået!\n');
    } else {
        console.log(`⚠️  RESULTAT: Der opstod ${stats.unexpectedErrors} uventede fejl under simuleringen.\n`);
    }
}

// Start simuleringen
runSimulation().catch(err => {
    console.error('Fatal fejl i simuleringen:', err);
});
