import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Appointment, AppointmentStatusEnum, CountryISOEnum, ScheduleDetailsInterface } from '../domain/entities/appointment';
import { AppointmentRepositoryInterface } from '../domain/repositories/appointment-repository';

interface DynamoDBAppointmentItemInterface {
    id: string;
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    status: string;
    scheduleDetails?: {
        scheduleId: number;
        centerId: number;
        specialtyId: number;
        medicId: number;
        date: string;
    };
    createdAt: string;
    updatedAt: string;
}

export class DynamoDBRepository implements AppointmentRepositoryInterface {
    private readonly docClient: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor() {
        const client = new DynamoDBClient({});
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.DYNAMODB_TABLE!;
    }

    async save(appointment: Appointment): Promise<void> {
        const item = this.toItem(appointment);

        await this.docClient.send(
            new PutCommand({
                TableName: this.tableName,
                Item: item,
            })
        );
    }

    async findById(id: string): Promise<Appointment | null> {
        const result = await this.docClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { id },
            })
        );

        if (!result.Item) {
            return null;
        }

        return this.toDomain(result.Item as DynamoDBAppointmentItemInterface);
    }

    async findByInsuredId(insuredId: string): Promise<Appointment[]> {
        const result = await this.docClient.send(
            new QueryCommand({
                TableName: this.tableName,
                IndexName: 'insuredId-index',
                KeyConditionExpression: 'insuredId = :insuredId',
                ExpressionAttributeValues: {
                    ':insuredId': insuredId,
                },
            })
        );

        if (!result.Items || result.Items.length === 0) {
            return [];
        }

        return result.Items.map((item) => this.toDomain(item as DynamoDBAppointmentItemInterface));
    }

    async update(appointment: Appointment): Promise<void> {
        await this.docClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { id: appointment.id },
                UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':status': appointment.status,
                    ':updatedAt': appointment.updatedAt.toISOString(),
                },
            })
        );
    }

    private toItem(appointment: Appointment): DynamoDBAppointmentItemInterface {
        const item: DynamoDBAppointmentItemInterface = {
            id: appointment.id,
            insuredId: appointment.insuredId,
            scheduleId: appointment.scheduleId,
            countryISO: appointment.countryISO,
            status: appointment.status,
            createdAt: appointment.createdAt.toISOString(),
            updatedAt: appointment.updatedAt.toISOString(),
        };

        if (appointment.scheduleDetails) {
            item.scheduleDetails = {
                ...appointment.scheduleDetails,
                date: appointment.scheduleDetails.date.toISOString(),
            };
        }

        return item;
    }

    private toDomain(item: DynamoDBAppointmentItemInterface): Appointment {
        let scheduleDetails: ScheduleDetailsInterface | undefined;

        if (item.scheduleDetails) {
            scheduleDetails = {
                ...item.scheduleDetails,
                date: new Date(item.scheduleDetails.date),
            };
        }

        return Appointment.reconstitute({
            id: item.id,
            insuredId: item.insuredId,
            scheduleId: item.scheduleId,
            countryISO: item.countryISO as CountryISOEnum,
            status: item.status as AppointmentStatusEnum,
            scheduleDetails,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
        });
    }
}