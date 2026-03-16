const https = require('https');

const key = 'AIzaSyAWLPd9ira2c2lRFwLtnJvFMEkxE9CzYYI';
const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=14.5995,120.9842&key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(data);
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
