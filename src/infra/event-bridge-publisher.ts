import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Appointment } from '../domain/entities/appointment';
import { EventPublisherInterface } from '../domain/services/message-publisher';

export class EventBridgePublisher implements EventPublisherInterface {
    private readonly eventBridgeClient: EventBridgeClient;
    private readonly eventBusName: string;

    constructor() {
        this.eventBridgeClient = new EventBridgeClient({});
        this.eventBusName = process.env.EVENT_BUS_NAME!;

        if (!this.eventBusName) {
            throw new Error('EVENT_BUS_NAME environment variable is required');
        }
    }

    async publishEvent(eventType: string, appointment: Appointment): Promise<void> {
        const detail = {
            id: appointment.id,
            insuredId: appointment.insuredId,
            scheduleId: appointment.scheduleId,
            countryISO: appointment.countryISO,
            status: appointment.status,
            scheduleDetails: appointment.scheduleDetails,
            updatedAt: appointment.updatedAt.toISOString(),
            processedAt: new Date().toISOString(),
        };

        console.log('Publishing event to EventBridge:', {
            eventBusName: this.eventBusName,
            eventType,
            appointmentId: appointment.id,
            countryISO: appointment.countryISO,
        });

        try {
            const result = await this.eventBridgeClient.send(
                new PutEventsCommand({
                    Entries: [
                        {
                            Source: 'appointment.service',
                            DetailType: eventType,
                            Detail: JSON.stringify(detail),
                            EventBusName: this.eventBusName,
                            Resources: [
                                `appointment:${appointment.id}`,
                                `country:${appointment.countryISO}`,
                            ],
                            Time: new Date(),
                        },
                    ],
                })
            );

            if (result.FailedEntryCount && result.FailedEntryCount > 0) {
                const errors = result.Entries?.filter(entry => entry.ErrorCode);
                console.error('Failed to publish some events:', errors);
                throw new Error(`Failed to publish ${result.FailedEntryCount} events`);
            }

            console.log('Event published successfully to EventBridge:', {
                eventId: result.Entries?.[0]?.EventId,
            });
        } catch (error) {
            console.error('Error publishing event to EventBridge:', error);
            throw new Error(`Failed to publish event to EventBridge: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}