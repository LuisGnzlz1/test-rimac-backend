import { Appointment } from '../../domain/entities/appointment';
import { AppointmentRepositoryInterface } from '../../domain/repositories/appointment-repository';

export class ListAppointmentsUseCase {
    constructor(
        private readonly appointmentRepository: AppointmentRepositoryInterface
    ) {}

    async execute(insuredId: string): Promise<Appointment[]> {
        const appointments = await this.appointmentRepository.findByInsuredId(insuredId);
        return appointments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
}