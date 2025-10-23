import { UpdateAppointmentStatusUseCase } from '../update-appointment';
import { AppointmentRepositoryInterface } from '../../../domain/repositories/appointment-repository';
import { Appointment, AppointmentStatusEnum, CountryISOEnum } from '../../../domain/entities/appointment';

describe('UpdateAppointmentStatusUseCase', () => {
    let mockRepository: jest.Mocked<AppointmentRepositoryInterface>;
    let useCase: UpdateAppointmentStatusUseCase;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByInsuredId: jest.fn(),
            update: jest.fn(),
        };

        useCase = new UpdateAppointmentStatusUseCase(mockRepository);
    });

    describe('execute', () => {
        it('should update appointment status to completed', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });

            mockRepository.findById.mockResolvedValue(appointment);
            mockRepository.update.mockResolvedValue();

            // Act
            await useCase.execute('123', AppointmentStatusEnum.COMPLETED);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith('123');
            expect(mockRepository.update).toHaveBeenCalledWith(appointment);
            expect(appointment.status).toBe(AppointmentStatusEnum.COMPLETED);
        });

        it('should not update if appointment not found', async () => {
            // Arrange
            mockRepository.findById.mockResolvedValue(null);

            // Act
            await useCase.execute('nonexistent', AppointmentStatusEnum.COMPLETED);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent');
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should not update if already in target status', async () => {
            // Arrange
            const appointment = Appointment.create({
                id: '123',
                insuredId: '00123',
                scheduleId: 100,
                countryISO: CountryISOEnum.PERU,
            });
            appointment.complete();

            mockRepository.findById.mockResolvedValue(appointment);

            // Act
            await useCase.execute('123', AppointmentStatusEnum.COMPLETED);

            // Assert
            expect(mockRepository.findById).toHaveBeenCalled();
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

    });
});