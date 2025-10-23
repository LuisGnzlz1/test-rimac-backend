import { z } from 'zod';
import { CountryISOEnum } from '../entities/appointment';

export const CreateAppointmentSchema = z.object({
    insuredId: z
        .string()
        .length(5, 'insuredId must be exactly 5 digits')
        .regex(/^\d{5}$/, 'insuredId must contain only digits'),
    scheduleId: z
        .number()
        .int('scheduleId must be an integer')
        .positive('scheduleId must be positive'),
    countryISO: z.nativeEnum(CountryISOEnum, {
        message: 'countryISO must be either "PE" or "CL"'
    })
});

export type CreateAppointmentDTO = z.infer<typeof CreateAppointmentSchema>;

export const ScheduleDetailsSchema = z.object({
    scheduleId: z.number().int().positive(),
    centerId: z.number().int().positive(),
    specialtyId: z.number().int().positive(),
    medicId: z.number().int().positive(),
    date: z.string().datetime(),
});

export type ScheduleDetailsDTO = z.infer<typeof ScheduleDetailsSchema>;