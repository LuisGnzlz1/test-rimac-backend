import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ProcessCountryAppointmentUseCase } from '../application/use-cases/process-country-appointment';
import { RDSAppointmentRepository } from '../infra/rds-repository';
import { EventBridgePublisher } from '../infra/event-bridge-publisher';
import { Appointment, AppointmentStatusEnum, CountryISOEnum } from '../domain/entities/appointment';

const rdsRepository = new RDSAppointmentRepository();
const eventPublisher = new EventBridgePublisher();
const processAppointmentUseCase = new ProcessCountryAppointmentUseCase(
    rdsRepository,
    eventPublisher
);

interface SNSMessage {
    Message: string;
}

interface AppointmentMessage {
    id: string;
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
    const country = process.env.COUNTRY;
    console.log(`Processing appointments for country: ${country}`);

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error('Error processing record:', error);
        }
    }
};

async function processRecord(record: SQSRecord): Promise<void> {
    const snsMessage: SNSMessage = JSON.parse(record.body);
    const appointmentData: AppointmentMessage = JSON.parse(snsMessage.Message);
    console.log('Processing appointment:', appointmentData);

    const appointment = Appointment.reconstitute({
        id: appointmentData.id,
        insuredId: appointmentData.insuredId,
        scheduleId: appointmentData.scheduleId,
        countryISO: appointmentData.countryISO as CountryISOEnum,
        status: appointmentData.status as AppointmentStatusEnum,
        createdAt: new Date(appointmentData.createdAt),
        updatedAt: new Date(appointmentData.updatedAt),
    });

    await processAppointmentUseCase.execute(appointment);
    console.log(`Appointment ${appointmentData.id} processed successfully`);
}