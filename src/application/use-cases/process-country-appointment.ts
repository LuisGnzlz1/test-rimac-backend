import { Appointment } from '../../domain/entities/appointment';
import { RDSAppointmentRepositoryInterface } from '../../domain/repositories/appointment-repository';
import { EventPublisherInterface } from '../../domain/services/message-publisher';
import {delay} from "../../utils/delay";

export class ProcessCountryAppointmentUseCase {
    constructor(
        private readonly rdsRepository: RDSAppointmentRepositoryInterface,
        private readonly eventPublisher: EventPublisherInterface
    ) {}

    async execute(appointment: Appointment): Promise<void> {
        const country = process.env.COUNTRY || 'UNKNOWN';

        try {
            await this.rdsRepository.saveToRDS(appointment);

            await this.applyCountrySpecificLogic(appointment, country);

            await delay(8000);

            await this.eventPublisher.publishEvent('AppointmentProcessed', appointment);
            console.log('Event published to EventBridge successfully');

            console.log('Appointment processed successfully: ', {
                appointmentId: appointment.id,
                country,
            });
        } catch (error) {
            console.error('Error processing appointment: ', {
                appointmentId: appointment.id,
                country,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Failed to process appointment');
        }
    }

    private async applyCountrySpecificLogic(
        appointment: Appointment,
        country: string
    ): Promise<void> {
        switch (country) {
            case 'PE':
                await this.applyPeruLogic(appointment);
                break;
            case 'CL':
                await this.applyChileLogic(appointment);
                break;
            default:
                console.warn('No specific logic for country:', country);
        }
    }

    private async applyPeruLogic(appointment: Appointment): Promise<void> {
        console.log('Peru logic applied successfully', appointment);

    }

    private async applyChileLogic(appointment: Appointment): Promise<void> {
        console.log('Chile logic applied successfully', appointment);
    }

}

