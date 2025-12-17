import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to MQTT broker
   */
  private async connect(): Promise<void> {
    const brokerUrl = this.configService.get<string>(
      'MQTT_BROKER_URL',
      'mqtt://localhost:1883',
    );
    const clientId = `simulator-${Math.random().toString(16).slice(2, 8)}`;

    this.logger.log(`Connecting to MQTT broker: ${brokerUrl}`);

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Connected to MQTT broker (${clientId})`);
        resolve();
      });

      this.client.on('error', (error) => {
        this.logger.error(`MQTT error: ${error.message}`);
        reject(error);
      });

      this.client.on('reconnect', () => {
        this.logger.warn('Reconnecting to MQTT broker...');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('MQTT connection closed');
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  private async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client.end(false, {}, () => {
          this.logger.log('Disconnected from MQTT broker');
          resolve();
        });
      });
    }
  }

  /**
   * Publish message to MQTT topic
   */
  async publish(topic: string, payload: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('MQTT client not connected');
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify(payload);

      this.client.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish: ${error.message}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if MQTT client is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
