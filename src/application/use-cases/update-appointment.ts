import { AppointmentStatusEnum } from '../../domain/entities/appointment';
import { AppointmentRepositoryInterface } from '../../domain/repositories/appointment-repository';

export class UpdateAppointmentStatusUseCase {
    constructor(private readonly appointmentRepository: AppointmentRepositoryInterface) {}

    async execute(appointmentId: string, newStatus: AppointmentStatusEnum): Promise<void> {

        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (!appointment) {
            console.warn('Appointment not found in DynamoDB:', appointmentId);
            return;
        }

        if (appointment.status === newStatus) {
            console.log('Appointment already in target status:', {
                appointmentId,
                status: newStatus,
            });
            return;
        }

        try {
            switch (newStatus) {
                case AppointmentStatusEnum.COMPLETED:
                    appointment.complete();
                    break;
                case AppointmentStatusEnum.FAILED:
                    appointment.fail();
                    break;
                default:
                    appointment.updateStatus(newStatus);
                    break;
            }
        } catch (error) {
            console.error('Error update logic status appointment in use case :', error);
            throw error;
        }

        try {
            await this.appointmentRepository.update(appointment);
        } catch (error) {
            console.error('Error updating appointment in repositories:', error);
        }
    }

}