const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

const dataFile = 'bids.json';

let highestBid = 0;
let highestBidder = '';
let bidHistory = [];

function loadBidData() {
    if (fs.existsSync(dataFile)) {
        try {
            const data = fs.readFileSync(dataFile, 'utf8');
            const parsedData = JSON.parse(data);
            highestBid = parsedData.highestBid || 0;
            highestBidder = parsedData.highestBidder || '';
            bidHistory = parsedData.bidHistory || [];
        } catch (err) {
            console.error('Error reading or parsing bids.json:', err);
        }
    }
}

function saveBidData() {
    const data = {
        highestBid: highestBid,
        highestBidder: highestBidder,
        bidHistory: bidHistory,
    };
    try {
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing to bids.json:', err);
    }
}

loadBidData();

// Lav HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    if (req.method === 'GET' && pathname === '/') {
        // server til HTML side
        fs.readFile('C:/Users/HFGF/Desktop/server and client/views/index.html', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading index.html:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            // Inject dynamisk ind i  HTML
            data = data.replace('{{highestBidder}}', highestBidder || 'Ingen bud endnu');
            data = data.replace('{{highestBid}}', highestBid);
            data = data.replace('{{bidHistory}}', bidHistory.map(bid => 
                `<tr><td>${bid.name}</td><td>$${bid.bid}</td></tr>`).join(''));

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });

    } else if (req.method === 'POST' && pathname === '/bid') {
        // Håndter input
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const formData = querystring.parse(body);
            const { name, bid } = formData;

            if (parseInt(bid) > highestBid) {
                highestBid = parseInt(bid);
                highestBidder = name;
                bidHistory.unshift({ name: name, bid: bid }); 
                saveBidData(); 
            }

            // Tag til homepage
            res.writeHead(302, { 'Location': '/' });
            res.end();
        });

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start serveren
server.listen(5000, () => {
    console.log('Serveren kører på http://localhost:5000');
});
