import { Injectable, Logger } from '@nestjs/common';

export type EventType = 'NORMAL' | 'TRAFFIC' | 'GUNSHOT' | 'SCREAM';

export interface NoiseResult {
  level: number;
  eventType: EventType;
}

@Injectable()
export class NoiseGeneratorService {
  private readonly logger = new Logger(NoiseGeneratorService.name);

  // Time-based base noise levels (in dB)
  private readonly NOISE_PATTERNS = {
    rushHours: { start: [7, 17], end: [9, 19], base: 80 }, // 7-9h, 17-19h
    nightHours: { start: [23, 0], end: [5, 6], base: 40 }, // 23-5h
    normalHours: { base: 60 }, // Other times
  };

  /**
   * Generate noise event based on current time
   */
  generateNoiseEvent(): NoiseResult {
    const hour = new Date().getHours();
    const baseNoise = this.getBaseNoiseByTime(hour);
    const jitter = (Math.random() - 0.5) * 10; // ±5 dB
    const noiseLevel = baseNoise + jitter;

    // Anomaly generation (1% total chance)
    const random = Math.random();

    if (random < 0.005) {
      // 0.5% chance: GUNSHOT
      return {
        level: 120 + Math.random() * 10, // 120-130 dB
        eventType: 'GUNSHOT',
      };
    }

    if (random < 0.01) {
      // 0.5% chance: SCREAM
      return {
        level: 95 + Math.random() * 10, // 95-105 dB
        eventType: 'SCREAM',
      };
    }

    // 99% chance: Normal traffic/ambient noise
    return this.determineEventType(noiseLevel, hour);
  }

  /**
   * Get base noise level based on time of day
   */
  private getBaseNoiseByTime(hour: number): number {
    const { rushHours, nightHours, normalHours } = this.NOISE_PATTERNS;

    // Rush hours (7-9h or 17-19h)
    if (
      (hour >= rushHours.start[0] && hour < rushHours.end[0]) ||
      (hour >= rushHours.start[1] && hour < rushHours.end[1])
    ) {
      return rushHours.base;
    }

    // Night hours (23-5h)
    if (hour >= nightHours.start[0] || hour < nightHours.end[1]) {
      return nightHours.base;
    }

    // Normal hours
    return normalHours.base;
  }

  /**
   * Determine event type based on noise level and time
   */
  private determineEventType(noiseLevel: number, hour: number): NoiseResult {
    // High noise during peak hours = TRAFFIC
    if (noiseLevel > 70 && this.isRushHour(hour)) {
      return {
        level: noiseLevel,
        eventType: 'TRAFFIC',
      };
    }

    // Moderate-high noise = TRAFFIC
    if (noiseLevel > 65) {
      return {
        level: noiseLevel,
        eventType: 'TRAFFIC',
      };
    }

    // Low noise = NORMAL
    return {
      level: noiseLevel,
      eventType: 'NORMAL',
    };
  }

  /**
   * Check if current time is rush hour
   */
  private isRushHour(hour: number): boolean {
    return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
  }

  /**
   * Get noise pattern statistics for logging
   */
  getStats() {
    const hour = new Date().getHours();
    const baseNoise = this.getBaseNoiseByTime(hour);

    return {
      hour,
      baseNoise,
      isRushHour: this.isRushHour(hour),
      anomalyChance: '1%',
    };
  }
}
