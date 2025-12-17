import { Controller, Get, Post, Patch, Body, Param, Delete, HttpCode, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimulatedDevice, DeviceProfile } from '../entities/simulated-device.entity';
import { DeviceSimulatorService } from '../services/device-simulator.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('devices')
export class DevicesController {
    constructor(
        @InjectRepository(SimulatedDevice)
        private deviceRepo: Repository<SimulatedDevice>,
        private simulatorService: DeviceSimulatorService,
    ) { }

    @Get()
    async getAll() {
        return this.deviceRepo.find();
    }

    @Post()
    async create(@Body() body: { name: string; lat: number; lng: number; profile?: DeviceProfile }) {
        const device = this.deviceRepo.create({
            id: `device-${uuidv4().substring(0, 8)}`, // Readable ID for demo
            name: body.name,
            lat: body.lat,
            lng: body.lng,
            profile: body.profile || DeviceProfile.QUIET_RESIDENTIAL,
            isActive: true
        });

        await this.deviceRepo.save(device);

        // Trigger Connect immediately
        await this.simulatorService.emitConnect(device);

        return device;
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: Partial<SimulatedDevice>) {
        const device = await this.deviceRepo.findOneBy({ id });
        if (!device) throw new NotFoundException('Device not found');

        Object.assign(device, body);
        await this.deviceRepo.save(device);

        if (device.isActive) {
            await this.simulatorService.emitConnect(device); // Re-announce or Update
        }

        return device;
    }

    @Post(':id/trigger')
    @HttpCode(200)
    async triggerEvent(@Param('id') id: string, @Body() body: { type: 'GUNSHOT' | 'SCREAM' }) {
        const device = await this.deviceRepo.findOneBy({ id });
        if (!device) throw new NotFoundException('Device not found');

        await this.simulatorService.forceEvent(device, body.type);
        return { success: true, message: `Triggered ${body.type} at ${device.name}` };
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.deviceRepo.delete(id);
        return { success: true };
    }
}
