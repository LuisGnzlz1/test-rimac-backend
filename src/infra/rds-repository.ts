import mysql from 'mysql2/promise';
import { Appointment, AppointmentStatusEnum, CountryISOEnum, ScheduleDetailsInterface } from '../domain/entities/appointment';
import { RDSAppointmentRepositoryInterface } from '../domain/repositories/appointment-repository';

interface RDSAppointmentRow {
    id: string;
    insured_id: string;
    schedule_id: number;
    country_iso: string;
    status: string;
    center_id?: number;
    specialty_id?: number;
    medic_id?: number;
    appointment_date?: Date;
    created_at: Date;
    updated_at: Date;
}

export class RDSAppointmentRepository implements RDSAppointmentRepositoryInterface {
    private pool: mysql.Pool;
    private readonly country: string;
    private readonly dbConfig: {
        host: string;
        user: string;
        password: string;
        database: string;
        port: number;
    };

    constructor() {
        this.country = process.env.COUNTRY || 'UNKNOWN';
        this.validateEnvironment();

        this.dbConfig = {
            host: process.env.RDS_HOST!,
            user: process.env.RDS_USER!,
            password: process.env.RDS_PASSWORD!,
            database: process.env.RDS_DATABASE!,
            port: parseInt(process.env.RDS_PORT || '3306'),
        };

        this.pool = mysql.createPool({
            ...this.dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            ssl: process.env.RDS_SSL === 'true' ? {rejectUnauthorized: true} : undefined,
        });

        console.log('RDS connection pool created for country:', this.country);
    }

    private validateEnvironment(): void {
        const required = ['RDS_HOST', 'RDS_USER', 'RDS_PASSWORD', 'RDS_DATABASE'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        if (this.country !== 'PE' && this.country !== 'CL') {
            throw new Error(`Invalid COUNTRY environment variable: ${this.country}. Must be "PE" or "CL"`);
        }
    }

    async saveToRDS(appointment: Appointment): Promise<void> {
        const query = `
            INSERT INTO appointments
            (id, insured_id, schedule_id, country_iso, status,
             center_id, specialty_id, medic_id, appointment_date,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY
            UPDATE
                status =
            VALUES (status), center_id =
            VALUES (center_id), specialty_id =
            VALUES (specialty_id), medic_id =
            VALUES (medic_id), appointment_date =
            VALUES (appointment_date), updated_at =
            VALUES (updated_at)
        `;

        const values = [
            appointment.id,
            appointment.insuredId,
            appointment.scheduleId,
            appointment.countryISO,
            appointment.status,
            appointment.scheduleDetails?.centerId || null,
            appointment.scheduleDetails?.specialtyId || null,
            appointment.scheduleDetails?.medicId || null,
            appointment.scheduleDetails?.date || null,
            appointment.createdAt,
            appointment.updatedAt,
        ];

        try {
            const [result] = await this.pool.execute(query, values);

            console.log('Appointment saved successfully to RDS:', {
                appointmentId: appointment.id,
                affectedRows: (result as any).affectedRows,
            });
        } catch (error) {
            console.error('Error saving appointment to RDS:', error);
            throw new Error(`Failed to save appointment to RDS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findByIdFromRDS(id: string): Promise<Appointment | null> {
        const query = `
            SELECT id,
                   insured_id,
                   schedule_id,
                   country_iso,
                   status,
                   center_id,
                   specialty_id,
                   medic_id,
                   appointment_date,
                   created_at,
                   updated_at
            FROM appointments
            WHERE id = ?
              AND country_iso = ?
        `;

        console.log('Finding appointment in RDS:', {id});

        try {
            const [rows] = await this.pool.execute(query, [id, this.country]);
            const appointments = rows as RDSAppointmentRow[];

            if (appointments.length === 0) {
                console.log('Appointment not found in RDS:', {id});
                return null;
            }

            console.log('Appointment found in RDS:', {id});
            return this.toDomain(appointments[0]);
        } catch (error) {
            console.error('Error finding appointment in RDS:', error);
            throw new Error(`Failed to find appointment in RDS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private toDomain(row: RDSAppointmentRow): Appointment {
        let scheduleDetails: ScheduleDetailsInterface | undefined;

        if (row.center_id && row.specialty_id && row.medic_id && row.appointment_date) {
            scheduleDetails = {
                scheduleId: row.schedule_id,
                centerId: row.center_id,
                specialtyId: row.specialty_id,
                medicId: row.medic_id,
                date: new Date(row.appointment_date),
            };
        }

        return Appointment.reconstitute({
            id: row.id,
            insuredId: row.insured_id,
            scheduleId: row.schedule_id,
            countryISO: row.country_iso as CountryISOEnum,
            status: row.status as AppointmentStatusEnum,
            scheduleDetails,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        });
    }

    async close(): Promise<void> {
        await this.pool.end();
        console.log('Close RDS connection pool for country:', this.country);
    }

}
