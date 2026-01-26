
import https from 'https';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set.');
    process.exit(1);
}

const message = process.argv[2] || 'Deployment Completed! 🚀';

const postData = JSON.stringify({
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'Markdown'
});

const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('Notification sent successfully!');
        } else {
            console.error(`Failed to send notification. Status: ${res.statusCode}`);
            console.error('Response:', data);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.error(JSON.stringify(e, null, 2));
    process.exit(1);
});

req.write(postData);
req.end();
