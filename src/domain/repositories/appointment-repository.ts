import { Appointment } from '../entities/appointment';

export interface AppointmentRepositoryInterface {
    save(appointment: Appointment): Promise<void>;
    findById(id: string): Promise<Appointment | null>;
    findByInsuredId(insuredId: string): Promise<Appointment[]>;
    update(appointment: Appointment): Promise<void>;
}

export interface RDSAppointmentRepositoryInterface {
    saveToRDS(appointment: Appointment): Promise<void>;
    findByIdFromRDS(id: string): Promise<Appointment | null>;
}