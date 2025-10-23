export enum AppointmentStatusEnum {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum CountryISOEnum {
    PERU = 'PE',
    CHILE = 'CL',
}

export interface ScheduleDetailsInterface {
    scheduleId: number;
    centerId: number;
    specialtyId: number;
    medicId: number;
    date: Date;
}

export interface AppointmentRequestInterface {
    insuredId: string;
    scheduleId: number;
    countryISO: CountryISOEnum;
}

export interface AppointmentInterface {
    id: string;
    insuredId: string;
    scheduleId: number;
    countryISO: CountryISOEnum;
    status: AppointmentStatusEnum;
    scheduleDetails?: ScheduleDetailsInterface;
    createdAt: Date;
    updatedAt: Date;
}

export class Appointment {
    private constructor(private props: AppointmentInterface) {}

    static create(params: Omit<AppointmentInterface, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { id: string }): Appointment {
        const now = new Date();
        return new Appointment({
            ...params,
            status: AppointmentStatusEnum.PENDING,
            createdAt: now,
            updatedAt: now,
        });
    }

    static reconstitute(props: AppointmentInterface): Appointment {
        return new Appointment(props);
    }

    get id(): string {
        return this.props.id;
    }

    get insuredId(): string {
        return this.props.insuredId;
    }

    get scheduleId(): number {
        return this.props.scheduleId;
    }

    get countryISO(): CountryISOEnum {
        return this.props.countryISO;
    }

    get status(): AppointmentStatusEnum {
        return this.props.status;
    }

    get scheduleDetails(): ScheduleDetailsInterface | undefined {
        return this.props.scheduleDetails;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    updateStatus(status: AppointmentStatusEnum): void {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }

    complete(): void {
        if (this.props.status !== AppointmentStatusEnum.PENDING) {
            throw new Error(`Cannot complete appointment with status ${this.props.status}`);
        }
        this.updateStatus(AppointmentStatusEnum.COMPLETED);
    }

    fail(): void {
        if (this.props.status === AppointmentStatusEnum.COMPLETED) {
            throw new Error('Cannot fail a completed appointment');
        }
        this.updateStatus(AppointmentStatusEnum.FAILED);
    }

    toJSON(): AppointmentInterface {
        return { ...this.props };
    }
}