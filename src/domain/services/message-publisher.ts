import { Appointment } from '../entities/appointment';

export interface MessagePublisherInterface {
    publish(appointment: Appointment): Promise<void>;
}

export interface EventPublisherInterface {
    publishEvent(eventType: string, appointment: Appointment): Promise<void>;
}