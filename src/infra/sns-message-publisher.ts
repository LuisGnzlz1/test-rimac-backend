import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Appointment } from '../domain/entities/appointment';
import { MessagePublisherInterface } from '../domain/services/message-publisher';

export class SNSMessagePublisher implements MessagePublisherInterface {
    private readonly snsClient: SNSClient;
    private readonly topicArn: string;

    constructor() {
        this.snsClient = new SNSClient({});
        this.topicArn = process.env.SNS_TOPIC_ARN!;

        if (!this.topicArn) {
            throw new Error('SNS_TOPIC_ARN environment variable is required');
        }
    }

    async publish(appointment: Appointment): Promise<void> {
        const message = JSON.stringify({
            id: appointment.id,
            insuredId: appointment.insuredId,
            scheduleId: appointment.scheduleId,
            countryISO: appointment.countryISO,
            status: appointment.status,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
        });

        console.log('Publishing message to SNS:', {
            topicArn: this.topicArn,
            appointmentId: appointment.id,
            countryISO: appointment.countryISO,
        });

        try {
            await this.snsClient.send(
                new PublishCommand({
                    TopicArn: this.topicArn,
                    Message: message,
                    MessageAttributes: {
                        countryISO: {
                            DataType: 'String',
                            StringValue: appointment.countryISO,
                        },
                        appointmentId: {
                            DataType: 'String',
                            StringValue: appointment.id,
                        },
                    },
                })
            );

            console.log('Message published successfully to SNS');
        } catch (error) {
            console.error('Error publishing message to SNS:', error);
            throw new Error(`Failed to publish message to SNS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}