import { ListAppointmentsUseCase } from '../list-appointment';
import { AppointmentRepositoryInterface } from '../../../domain/repositories/appointment-repository';
import { Appointment, CountryISOEnum } from '../../../domain/entities/appointment';

describe('ListAppointmentUseCase', () => {
    let mockRepository: jest.Mocked<AppointmentRepositoryInterface>;
    let useCase: ListAppointmentsUseCase;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findByInsuredId: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
        };

        useCase = new ListAppointmentsUseCase(mockRepository);
    });

    it('should return appointment when found', async () => {
        const mockAppointment = [
            Appointment.create({
            id: '123',
            insuredId: '00123',
            scheduleId: 100,
            countryISO: CountryISOEnum.PERU,
            }),
            Appointment.create({
                id: '432',
                insuredId: '00123',
                scheduleId: 88,
                countryISO: CountryISOEnum.PERU,
            })
        ];

        mockRepository.findByInsuredId.mockResolvedValue(mockAppointment);

        const results = await useCase.execute('00123');

        expect(results).toHaveLength(2)
        expect(mockRepository.findByInsuredId).toHaveBeenCalledWith('00123');
    });

});