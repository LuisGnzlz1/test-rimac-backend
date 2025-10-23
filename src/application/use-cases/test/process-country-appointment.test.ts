import { ProcessCountryAppointmentUseCase } from '../process-country-appointment';
import { RDSAppointmentRepositoryInterface } from '../../../domain/repositories/appointment-repository';
import { EventPublisherInterface } from '../../../domain/services/message-publisher';
import { Appointment, CountryISOEnum } from '../../../domain/entities/appointment';

describe('ProcessCountryAppointmentUseCase', () => {
    let mockRDSRepository: jest.Mocked<RDSAppointmentRepositoryInterface>;
    let mockEventPublisher: jest.Mocked<EventPublisherInterface>;
    let useCase: ProcessCountryAppointmentUseCase;

    beforeEach(() => {
        mockRDSRepository = {
            saveToRDS: jest.fn(),
            findByIdFromRDS: jest.fn(),
        };

        mockEventPublisher = {
            publishEvent: jest.fn(),
        };

        useCase = new ProcessCountryAppointmentUseCase(
            mockRDSRepository,
            mockEventPublisher
        );
        process.env.COUNTRY = 'PE';
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.COUNTRY;
    });

    describe('execute', () => {

        it('should process appointment successfully for Peru', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });

            mockRDSRepository.saveToRDS.mockResolvedValue();
            mockEventPublisher.publishEvent.mockResolvedValue();

            // Act
            await useCase.execute(appointment);

            // Assert
            expect(mockRDSRepository.saveToRDS).toHaveBeenCalledWith(appointment);
            expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
                'AppointmentProcessed',
                appointment
            );
        });

        it('should process appointment successfully for Chile', async () => {
            // Arrange
            process.env.COUNTRY = 'CL';

            const appointment = Appointment.create({
                id: '456',
                insuredId: '00456',
                scheduleId: 101,
                countryISO: CountryISOEnum.CHILE,
            });

            mockRDSRepository.saveToRDS.mockResolvedValue();
            mockEventPublisher.publishEvent.mockResolvedValue();

            // Act
            await useCase.execute(appointment);

            // Assert
            expect(mockRDSRepository.saveToRDS).toHaveBeenCalledWith(appointment);
            expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
                'AppointmentProcessed',
                appointment
            );
        });

        it('should handle RDS save errors', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });

            mockRDSRepository.saveToRDS.mockRejectedValue(new Error('RDS connection error'));

            // Act & Assert
            await expect(useCase.execute(appointment)).rejects.toThrow('Failed to process appointment');

            expect(mockRDSRepository.saveToRDS).toHaveBeenCalled();
            expect(mockEventPublisher.publishEvent).not.toHaveBeenCalled();
        });

        it('should handle EventBridge publish errors', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });

            mockRDSRepository.saveToRDS.mockResolvedValue();
            mockEventPublisher.publishEvent.mockRejectedValue(new Error('EventBridge error'));

            // Act & Assert
            await expect(useCase.execute(appointment)).rejects.toThrow('Failed to process appointment');

            expect(mockRDSRepository.saveToRDS).toHaveBeenCalled();
            expect(mockEventPublisher.publishEvent).toHaveBeenCalled();
        });

        it('should call saveToRDS before publishEvent', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });

            const callOrder: string[] = [];

            mockRDSRepository.saveToRDS.mockImplementation(async () => {
                callOrder.push('saveToRDS');
            });

            mockEventPublisher.publishEvent.mockImplementation(async () => {
                callOrder.push('publishEvent');
            });

            // Act
            await useCase.execute(appointment);

            // Assert
            expect(callOrder).toEqual(['saveToRDS', 'publishEvent']);
        });


    });

});