import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AvailabilityQueryDto {
  @IsString() @IsNotEmpty() businessSlug: string;
  @IsString() @IsNotEmpty() serviceId: string;
  @IsString() @IsNotEmpty() workerId: string;
  @IsDateString() date: string;
}

export class CreatePublicAppointmentDto extends AvailabilityQueryDto {
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'La hora debe usar formato HH:mm.' }) startTime: string;
  @IsString() @IsNotEmpty() @MaxLength(120) clientName: string;
  @IsString() @IsNotEmpty() @MaxLength(30) clientPhone: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class JoinQueueDto {
  @IsString() @IsNotEmpty() businessSlug: string;
  @IsString() @IsNotEmpty() workerId: string;
  @IsString() @IsNotEmpty() @MaxLength(120) clientName: string;
  @IsString() @IsNotEmpty() @MaxLength(30) clientPhone: string;
}
