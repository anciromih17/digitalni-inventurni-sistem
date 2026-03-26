import os
import json
import stomp

ACTIVEMQ_HOST = os.getenv("ACTIVEMQ_HOST", "activemq")
ACTIVEMQ_PORT = int(os.getenv("ACTIVEMQ_PORT", "61613"))
ACTIVEMQ_USER = os.getenv("ACTIVEMQ_USER", "admin")
ACTIVEMQ_PASSWORD = os.getenv("ACTIVEMQ_PASSWORD", "admin")

class MQProducer:
    def __init__(self):
        self.conn = None

    def connect(self):
        if self.conn and self.conn.is_connected():
            return

        self.conn = stomp.Connection([(ACTIVEMQ_HOST, ACTIVEMQ_PORT)])
        self.conn.connect(ACTIVEMQ_USER, ACTIVEMQ_PASSWORD, wait=True)
        print("[ActiveMQ] Connected to broker")

    def send_event(self, event):
        try:
            self.connect()
            self.conn.send(
                destination="/queue/system.events",
                body=json.dumps(event),
                headers={"content-type": "application/json"}
            )
            print("[ActiveMQ] Event sent:", event)
        except Exception as e:
            print("[ActiveMQ ERROR] Failed to send event:", str(e))

producer = MQProducer()