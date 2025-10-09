const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const vapidKeys = {
  publicKey: process.env.PUBLIC_VAPID_KEY,
  privateKey: process.env.PRIVATE_VAPID_KEY
};


webpush.setVapidDetails('mailto:seuemail@exemplo.com', vapidKeys.publicKey, vapidKeys.privateKey);

const getSubs = () => {
  try { return JSON.parse(fs.readFileSync('db.json', 'utf8')); }
  catch { return []; }
};
const saveSubs = (subs) => fs.writeFileSync('db.json', JSON.stringify(subs, null, 2));

app.post('/subscribe', (req, res) => {
  const subs = getSubs();
  subs.push(req.body);
  saveSubs(subs);
  res.status(201).json({ message: 'Inscrito!' });
});

app.post('/send', async (req, res) => {
  const subs = getSubs();
  const payload = JSON.stringify({
    title: req.body.title,
    body: req.body.body,
    icon: req.body.icon,
    url: req.body.url
  });

  await Promise.allSettled(subs.map(s => webpush.sendNotification(s, payload)));
  res.json({ sent: subs.length });
});

app.listen(10000, () => console.log('Servidor ativo na porta 10000'));

