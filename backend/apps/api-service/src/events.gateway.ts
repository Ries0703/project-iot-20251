import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Client, Transport, ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*', // Allow all origins for now (dev mode)
    },
    namespace: 'events',
})
export class EventsGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);
    private connectedClients = 0;
    private mqttClient: any; // Native MQTT client instance

    @Client({
        transport: Transport.MQTT,
        options: {
            url: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            clientId: 'api_gateway_' + Math.random().toString(16).substr(2, 8),
        },
    })
    client: ClientProxy;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        this.logger.log('Events Gateway initialized');
        // Connect to MQTT
        await this.client.connect();

        // Hack to get underlying MQTT client to subscribe manually
        // @ts-ignore
        this.mqttClient = this.client['mqttClient'];

        if (this.mqttClient) {
            this.mqttClient.on('message', (topic, message) => {
                this.handleMqttMessage(topic, message);
            });
            this.logger.log('Connected to internal MQTT broker for broadcasting');
        }
    }

    handleConnection(client: Socket) {
        this.connectedClients++;
        this.logger.log(`Client connected: ${client.id} (Total: ${this.connectedClients})`);

        // On-demand subscription: Subscribe only when first client connects
        if (this.connectedClients === 1) {
            this.subscribeToMqtt();
        }
    }

    handleDisconnect(client: Socket) {
        this.connectedClients--;
        this.logger.log(`Client disconnected: ${client.id} (Total: ${this.connectedClients})`);

        // Unsubscribe when last client leaves to save resources
        if (this.connectedClients === 0) {
            this.unsubscribeFromMqtt();
        }
    }

    private subscribeToMqtt() {
        if (this.mqttClient) {
            this.logger.log('🔌 Subscribing to city/internal/#');
            this.mqttClient.subscribe('city/internal/#');
        }
    }

    private unsubscribeFromMqtt() {
        if (this.mqttClient) {
            this.logger.log('zzz Unsubscribing from city/internal/# (No clients)');
            this.mqttClient.unsubscribe('city/internal/#');
        }
    }

    private handleMqttMessage(topic: string, message: Buffer) {
        try {
            const packet = JSON.parse(message.toString());
            // NestJS ClientProxy wraps data in { pattern, data }
            const payload = packet.data || packet;

            if (topic.includes('alerts')) {
                this.server.emit('alert', payload);
                this.logger.debug(`Broadcasting Alert: ${payload.id}`);
            } else if (topic.includes('updates')) {
                this.server.emit('update', payload);
            }
        } catch (e) {
            this.logger.error(`Error parsing MQTT message: ${e.message}`);
        }
    }
}
