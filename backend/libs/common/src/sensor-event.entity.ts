import { Entity, PrimaryColumn, Column, Index, CreateDateColumn } from 'typeorm';

/**
 * Event Type Enum
 */
export enum EventType {
    NORMAL = 'NORMAL',
    TRAFFIC = 'TRAFFIC',
    GUNSHOT = 'GUNSHOT',
    SCREAM = 'SCREAM',
}

/**
 * SensorEvent Entity (TimescaleDB Hypertable)
 * Represents a single noise measurement event from an IoT sensor device
 * 
 * Note: Uses composite primary key (id, timestamp) because TimescaleDB
 * hypertables require the partition key in all unique indexes
 */
@Entity('sensor_events')
@Index(['deviceId', 'timestamp'])
@Index(['eventType', 'timestamp'])
@Index(['noiseLevel', 'timestamp'])
export class SensorEvent {
    @PrimaryColumn('uuid')
    id: string;

    @PrimaryColumn({ type: 'timestamp with time zone' })
    timestamp: Date;

    @Column({ type: 'text', nullable: false })
    deviceId: string;

    @Column({ type: 'float', nullable: false })
    lat: number;

    @Column({ type: 'float', nullable: false })
    lng: number;

    @Column({ type: 'float', nullable: false, comment: 'Noise level in decibels (dB)' })
    noiseLevel: number;

    @Column({
        type: 'enum',
        enum: EventType,
        enumName: 'event_type_enum',
        default: EventType.NORMAL,
    })
    eventType: EventType;

    // PostGIS geometry column - auto-populated by database trigger
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
        select: false, // Don't select by default (use lat/lng instead)
    })
    location?: string; // WKT format or can be null

    @Column({ type: 'text', nullable: true })
    locationName?: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;
}
