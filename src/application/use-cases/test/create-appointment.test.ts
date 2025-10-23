import { CreateAppointmentUseCase } from '../create-appointment';
import { AppointmentRepositoryInterface } from '../../../domain/repositories/appointment-repository';
import { MessagePublisherInterface } from '../../../domain/services/message-publisher';
import { Appointment, AppointmentStatusEnum, CountryISOEnum } from '../../../domain/entities/appointment';

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('CreateAppointmentUseCase', () => {
    let mockRepository: jest.Mocked<AppointmentRepositoryInterface>;
    let mockPublisher: jest.Mocked<MessagePublisherInterface>;
    let useCase: CreateAppointmentUseCase;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByInsuredId: jest.fn(),
            update: jest.fn(),
        };

        mockPublisher = {
            publish: jest.fn(),
        };

        useCase = new CreateAppointmentUseCase(mockRepository, mockPublisher);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const validData = {
        insuredId: '00123',
        scheduleId: 100,
        countryISO: 'PE' as CountryISOEnum,
    };

    describe('execute', () => {
        it('should create appointment successfully for Peru', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            // Act
            const appointment = await useCase.execute(validData);

            // Assert
            expect(appointment).toBeInstanceOf(Appointment);
            expect(appointment.id).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(appointment.insuredId).toBe('00123');
            expect(appointment.scheduleId).toBe(100);
            expect(appointment.countryISO).toBe(CountryISOEnum.PERU);
            expect(appointment.status).toBe(AppointmentStatusEnum.PENDING);
        });

        it('should create appointment successfully for Chile', async () => {
            // Arrange
            const chileData = { ...validData, countryISO: 'CL' as CountryISOEnum };
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            // Act
            const appointment = await useCase.execute(chileData);

            // Assert
            expect(appointment.countryISO).toBe(CountryISOEnum.CHILE);
        });

        it('should call repository save method', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            // Act
            await useCase.execute(validData);

            // Assert
            expect(mockRepository.save).toHaveBeenCalledTimes(1);
            expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Appointment));
        });

        it('should call message publisher after saving', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            // Act
            await useCase.execute(validData);

            // Assert
            expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
            expect(mockPublisher.publish).toHaveBeenCalledWith(expect.any(Appointment));
        });

        it('should save before publishing', async () => {
            // Arrange
            const callOrder: string[] = [];

            mockRepository.save.mockImplementation(async () => {
                callOrder.push('save');
            });

            mockPublisher.publish.mockImplementation(async () => {
                callOrder.push('publish');
            });

            // Act
            await useCase.execute(validData);

            // Assert
            expect(callOrder).toEqual(['save', 'publish']);
        });

        it('should generate unique ID for each appointment', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            const uuid = require('uuid');
            uuid.v4
                .mockReturnValueOnce('id-1')
                .mockReturnValueOnce('id-2');

            // Act
            const appointment1 = await useCase.execute(validData);
            const appointment2 = await useCase.execute(validData);

            // Assert
            expect(appointment1.id).toBe('id-1');
            expect(appointment2.id).toBe('id-2');
        });

        it('should set createdAt and updatedAt timestamps', async () => {
            // Arrange
            mockRepository.save.mockResolvedValue();
            mockPublisher.publish.mockResolvedValue();

            const before = new Date();

            // Act
            const appointment = await useCase.execute(validData);

            const after = new Date();

            // Assert
            expect(appointment.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(appointment.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(appointment.updatedAt).toEqual(appointment.createdAt);
        });
    });

});