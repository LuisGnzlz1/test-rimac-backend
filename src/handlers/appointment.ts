import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent, Handler } from 'aws-lambda';
import { CreateAppointmentUseCase } from '../application/use-cases/create-appointment';
import { ListAppointmentsUseCase } from '../application/use-cases/list-appointment';
import { UpdateAppointmentStatusUseCase } from '../application/use-cases/update-appointment';
import { DynamoDBRepository } from '../infra/dynamodb-repository';
import { SNSMessagePublisher } from '../infra/sns-message-publisher';
import { CreateAppointmentSchema } from '../domain/validators/apointment.schema';
import {AppointmentRequestInterface, AppointmentStatusEnum} from '../domain/entities/appointment';
import {isSQSEvent} from "../utils/is-sqs";
import {badRequest, created, internalError, notFound, ok} from "../utils/http-response";
import {parseJson} from "../utils/parse-json";

const dynamoRepository = new DynamoDBRepository();
const messagePublisher = new SNSMessagePublisher();

const createAppointmentUseCase = new CreateAppointmentUseCase(
    dynamoRepository,
    messagePublisher
);
const listAppointmentsUseCase = new ListAppointmentsUseCase(dynamoRepository);
const updateStatusUseCase = new UpdateAppointmentStatusUseCase(dynamoRepository);

interface EventBridgeEventDetail {
    id: string;
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    status: string;
    updatedAt: string;
}

interface EventBridgeMessage {
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: EventBridgeEventDetail;
}

export const handler: Handler = async (event: APIGatewayProxyEvent | SQSEvent): Promise<APIGatewayProxyResult | void> => {
    if (isSQSEvent(event)) {
        return await handleSQSAppointmentUpdate(event as SQSEvent);
    }
    return await handleAPIGateway(event as APIGatewayProxyEvent);
};

async function handleAPIGateway(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const httpMethod = event.httpMethod;
    const path = event.path;

    try {
        if (httpMethod === 'POST' && path === '/appointments') {

            try {
                const request = parseJson(event.body) as AppointmentRequestInterface;
                const parsed = CreateAppointmentSchema.safeParse(request);

                if (!parsed.success) {
                    const errors = parsed.error.issues.map(i => ({message: i.message}));
                    return badRequest(errors[0].message);
                }

                const appointment = await createAppointmentUseCase.execute(request);

                const body = {
                    message: 'Appointment in process',
                    data: {
                        id: appointment.id,
                        insuredId: appointment.insuredId,
                        scheduleId: appointment.scheduleId,
                        countryISO: appointment.countryISO,
                        status: appointment.status,
                        createdAt: appointment.createdAt.toISOString(),
                    },
                }

                return created(body);

            } catch (error) {
                return internalError('Failed to create appointment');
            }
        }

        if (httpMethod === 'GET' && event.pathParameters?.insuredId) {
            try {
                const insuredId = event.pathParameters?.insuredId;
                if (!insuredId) return badRequest('insuredId is required');
                const appointments = await listAppointmentsUseCase.execute(insuredId);

                const body = {
                    insuredId,
                    total: appointments.length,
                    appointments: appointments.map((a) => ({
                        id: a.id,
                        insuredId: a.insuredId,
                        scheduleId: a.scheduleId,
                        countryISO: a.countryISO,
                        status: a.status,
                        scheduleDetails: a.scheduleDetails,
                        createdAt: a.createdAt.toISOString(),
                        updatedAt: a.updatedAt.toISOString(),
                    })),
                }

                return ok(body);

            } catch (error) {
                return internalError('Failed to list appointments');
            }
        }

        // if (method === 'GET' && path.endsWith('/docs/ui')) {
        //     return {
        //         statusCode: 200,
        //         headers: { 'content-type': 'text/html; charset=utf-8' },
        //         body: swaggerHtml,
        //     };
        // }
        //
        // if (method === 'GET' && path.endsWith('/docs')) {
        //     return responseToJson(200, openapi);
        // }

        return notFound('Missing route');

    } catch (error) {
        console.error('Error in API Gateway handler:', error);
        return internalError();
    }
}

async function handleSQSAppointmentUpdate(event: SQSEvent): Promise<void> {
    console.log('Handling appointment status updates from EventBridge');

    for (const record of event.Records) {
        try {
            let eventData: EventBridgeEventDetail;

            try {
                const eventBridgeMessage: EventBridgeMessage = JSON.parse(record.body);
                eventData = eventBridgeMessage.detail;

                console.log('Processing EventBridge message:', {
                    source: eventBridgeMessage.source,
                    detailType: eventBridgeMessage['detail-type'],
                    appointmentId: eventData.id,
                });
            } catch (error) {
                console.warn('Failed EventBridge message');
                eventData = JSON.parse(record.body);
            }

            console.log('Updating appointment status in DynamoDB:', {
                id: eventData.id,
                targetStatus: AppointmentStatusEnum.COMPLETED,
            });

            await updateStatusUseCase.execute(eventData.id, AppointmentStatusEnum.COMPLETED);

            console.log(`Appointment ${eventData.id} updated to completed`);
        } catch (error) {
            console.error('Error processing status update:', error);
            throw error;
        }
    }
}