import { z } from 'zod';
export declare enum JobStatus {
    REQUESTED = "REQUESTED",
    PENDING_ACCEPTANCE = "PENDING_ACCEPTANCE",
    ASSIGNED = "ASSIGNED",
    ON_ROUTE = "ON_ROUTE",
    INSPECTION = "INSPECTION",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    Requested = "REQUESTED",
    PendingAcceptance = "PENDING_ACCEPTANCE",
    Assigned = "ASSIGNED",
    OnRoute = "ON_ROUTE",
    Inspection = "INSPECTION",
    InProgress = "IN_PROGRESS",
    Completed = "COMPLETED"
}
export declare enum FacilityType {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
    INDUSTRIAL = "INDUSTRIAL",
    Residential = "RESIDENTIAL",
    Commercial = "COMMERCIAL",
    Industrial = "INDUSTRIAL"
}
export declare enum ServicePillar {
    HARD = "HARD",
    SOFT = "SOFT",
    STRATEGIC = "STRATEGIC",
    Hard = "HARD",
    Soft = "SOFT",
    Strategic = "STRATEGIC"
}
export { ServicePillar as ServiceType };
export declare enum SubscriptionTier {
    BASIC = "BASIC",
    PLUS = "PLUS",
    PREMIUM = "PREMIUM",
    Basic = "BASIC",
    Plus = "PLUS",
    Premium = "PREMIUM"
}
export declare enum Role {
    ADMIN = "ADMIN",
    CUSTOMER_CARE = "CUSTOMER_CARE",
    CUSTOMER = "CUSTOMER",
    WORKER = "WORKER",
    Admin = "ADMIN",
    CustomerCare = "CUSTOMER_CARE",
    Customer = "CUSTOMER",
    Worker = "WORKER"
}
export declare const locationCoordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
}>;
export type LocationCoordinates = z.infer<typeof locationCoordinatesSchema>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof Role>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
}, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
}>;
export type User = z.infer<typeof userSchema>;
export declare const workerSchema: z.ZodObject<{
    id: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof Role>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
} & {
    rating: z.ZodDefault<z.ZodNumber>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>;
    servicePillars: z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ServicePillar>, "many">>;
    isAvailable: z.ZodDefault<z.ZodBoolean>;
    activeJobs: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    rating: number;
    servicePillars: ServicePillar[];
    isAvailable: boolean;
    activeJobs: number;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
    location?: {
        latitude: number;
        longitude: number;
    } | undefined;
}, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
    rating?: number | undefined;
    location?: {
        latitude: number;
        longitude: number;
    } | undefined;
    servicePillars?: ServicePillar[] | undefined;
    isAvailable?: boolean | undefined;
    activeJobs?: number | undefined;
}>;
export type Worker = z.infer<typeof workerSchema>;
export declare const customerSchema: z.ZodObject<{
    id: z.ZodString;
    fullName: z.ZodString;
    email: z.ZodString;
    role: z.ZodNativeEnum<typeof Role>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
} & {
    facilityType: z.ZodNativeEnum<typeof FacilityType>;
    subscriptionTier: z.ZodNativeEnum<typeof SubscriptionTier>;
    facilityLocation: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    facilityType: FacilityType;
    subscriptionTier: SubscriptionTier;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
    facilityLocation?: {
        latitude: number;
        longitude: number;
    } | undefined;
}, {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string | Date;
    facilityType: FacilityType;
    subscriptionTier: SubscriptionTier;
    phoneNumber?: string | undefined;
    avatarUrl?: string | undefined;
    updatedAt?: string | Date | undefined;
    facilityLocation?: {
        latitude: number;
        longitude: number;
    } | undefined;
}>;
export type Customer = z.infer<typeof customerSchema>;
export declare const serviceRequestSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    servicePillar: z.ZodNativeEnum<typeof ServicePillar>;
    facilityType: z.ZodNativeEnum<typeof FacilityType>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof JobStatus>>;
    customerId: z.ZodString;
    workerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>;
    scheduledFor: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>>;
    quoteAmount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    status: JobStatus;
    id: string;
    createdAt: string | Date;
    location: {
        latitude: number;
        longitude: number;
    };
    facilityType: FacilityType;
    title: string;
    description: string;
    servicePillar: ServicePillar;
    customerId: string;
    updatedAt?: string | Date | undefined;
    workerId?: string | null | undefined;
    scheduledFor?: string | Date | null | undefined;
    quoteAmount?: number | null | undefined;
}, {
    id: string;
    createdAt: string | Date;
    location: {
        latitude: number;
        longitude: number;
    };
    facilityType: FacilityType;
    title: string;
    description: string;
    servicePillar: ServicePillar;
    customerId: string;
    status?: JobStatus | undefined;
    updatedAt?: string | Date | undefined;
    workerId?: string | null | undefined;
    scheduledFor?: string | Date | null | undefined;
    quoteAmount?: number | null | undefined;
}>;
export type ServiceRequest = z.infer<typeof serviceRequestSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registrationSchema: z.ZodEffects<z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    role: z.ZodDefault<z.ZodNativeEnum<typeof Role>>;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    companyName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    email: string;
    role: Role;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    phoneNumber?: string | undefined;
    companyName?: string | undefined;
}, {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    role?: Role | undefined;
    phoneNumber?: string | undefined;
    companyName?: string | undefined;
}>, {
    fullName: string;
    email: string;
    role: Role;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    phoneNumber?: string | undefined;
    companyName?: string | undefined;
}, {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    role?: Role | undefined;
    phoneNumber?: string | undefined;
    companyName?: string | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
