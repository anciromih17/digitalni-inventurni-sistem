const stompit = require('stompit');

const MQ_ENABLED =
    process.env.MQ_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'test' &&
    !!process.env.MQ_HOST;

const connectOptions = {
    host: process.env.MQ_HOST || 'activemq',
    port: Number(process.env.MQ_PORT || 61613),
    connectHeaders: {
        host: process.env.MQ_VHOST || '/',
        login: process.env.MQ_USER || 'admin',
        passcode: process.env.MQ_PASSWORD || 'admin',
    },
};

function sendEvent(event) {
    if (!MQ_ENABLED) return;

    stompit.connect(connectOptions, (error, client) => {
        if (error) {
            console.error('[ActiveMQ] Connection error:', error.message);
            return;
        }

        const frame = client.send({
            destination: '/queue/system.events',
            'content-type': 'application/json',
        });

        frame.write(JSON.stringify(event));
        frame.end();

        client.disconnect();
    });
}

module.exports = { sendEvent };