import { Entity, Column, PrimaryColumn } from 'typeorm';

export enum DeviceProfile {
  QUIET_RESIDENTIAL = 'QUIET_RESIDENTIAL',
  BUSY_INTERSECTION = 'BUSY_INTERSECTION',
  MARKET = 'MARKET',
}

@Entity('simulated_devices')
export class SimulatedDevice {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'float' })
  lat: number;

  @Column({ type: 'float' })
  lng: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'varchar',
    default: DeviceProfile.QUIET_RESIDENTIAL,
  })
  profile: DeviceProfile;

  @Column({ type: 'float', default: 40 })
  minNoise: number;

  @Column({ type: 'float', default: 90 })
  maxNoise: number;

  @Column({ type: 'text', default: '1.0.0' })
  firmware: string;
}
