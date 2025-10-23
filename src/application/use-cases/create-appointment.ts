import { v4 as uuidv4 } from 'uuid';
import { Appointment, CountryISOEnum, AppointmentRequestInterface } from '../../domain/entities/appointment';
import { AppointmentRepositoryInterface } from '../../domain/repositories/appointment-repository';
import { MessagePublisherInterface } from '../../domain/services/message-publisher';

export class CreateAppointmentUseCase {
    constructor(
        private readonly appointmentRepository: AppointmentRepositoryInterface,
        private readonly messagePublisher: MessagePublisherInterface
    ) {}

    async execute(data: AppointmentRequestInterface): Promise<Appointment> {

        const appointmentId = uuidv4();

        const appointment = Appointment.create({
            id: appointmentId,
            insuredId: data.insuredId,
            scheduleId: data.scheduleId,
            countryISO: data.countryISO as CountryISOEnum,
        });

        try {
            await this.appointmentRepository.save(appointment);
        } catch (error) {
            console.error('Error saving appointment to DynamoDB:', error);
        }

        try {
            await this.messagePublisher.publish(appointment);
        } catch (error) {
            console.error('Error publishing appointment to SNS:', error);
        }

        return appointment;
    }
}
