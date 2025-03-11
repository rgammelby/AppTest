const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.use('/', async (req, res) => {
    try {
        const targetUrl = `http://localhost:7093${req.url}`; // Keep the request path
        console.log(`Proxying request to: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            headers: {
                'Accept': '*/*',
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
            }
        });

        res.send(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send('Error fetching data');
    }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
