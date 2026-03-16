const https = require('https');

const key = 'AIzaSyAWLPd9ira2c2lRFwLtnJvFMEkxE9CzYYI';
// Testing Directions API: Manila to Quezon City
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=Manila&destination=Quezon+City&key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
