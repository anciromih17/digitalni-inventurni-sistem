const stompit = require('stompit');

const connectOptions = {
    host: 'activemq',
    port: 61613,
    connectHeaders: {
        host: '/',
        login: 'admin',
        passcode: 'admin'
    }
};

function sendEvent(event) {
    stompit.connect(connectOptions, (error, client) => {
        if (error) {
            console.error('[ActiveMQ] Connection error:', error.message);
            return;
        }

        const frame = client.send({
            'destination': '/queue/system.events',
            'content-type': 'application/json'
        });

        frame.write(JSON.stringify(event));
        frame.end();

        console.log('[ActiveMQ] Event sent:', event);
        client.disconnect();
    });
}

module.exports = { sendEvent };