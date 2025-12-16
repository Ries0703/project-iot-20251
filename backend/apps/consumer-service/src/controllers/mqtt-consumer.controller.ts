import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, MqttContext } from '@nestjs/microservices';
import { EventProcessingService } from '../services/event-processing.service';
import type { SensorEventDto } from '../services/event-processing.service';

@Controller()
export class MqttConsumerController {
    private readonly logger = new Logger(MqttConsumerController.name);

    constructor(private eventProcessingService: EventProcessingService) { }

    /**
     * Subscribe to MQTT topic: city/sensors/events
     */
    @MessagePattern('city/sensors/events')
    async handleSensorEvent(
        @Payload() event: SensorEventDto,
        @Ctx() context: MqttContext,
    ): Promise<void> {
        try {
            await this.eventProcessingService.processEvent(event);
        } catch (error) {
            this.logger.error(`Failed to process event: ${error.message}`, error.stack);
        }
    }
}
