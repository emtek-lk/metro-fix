"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationSchema = exports.loginSchema = exports.serviceRequestSchema = exports.customerSchema = exports.workerSchema = exports.userSchema = exports.locationCoordinatesSchema = exports.Role = exports.SubscriptionTier = exports.ServiceType = exports.ServicePillar = exports.FacilityType = exports.JobStatus = void 0;
const zod_1 = require("zod");
// ==========================================
// Core Domain Enums
// ==========================================
var JobStatus;
(function (JobStatus) {
    JobStatus["REQUESTED"] = "REQUESTED";
    JobStatus["PENDING_ACCEPTANCE"] = "PENDING_ACCEPTANCE";
    JobStatus["ASSIGNED"] = "ASSIGNED";
    JobStatus["ON_ROUTE"] = "ON_ROUTE";
    JobStatus["INSPECTION"] = "INSPECTION";
    JobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    JobStatus["COMPLETED"] = "COMPLETED";
    // Backward-compatibility aliases
    JobStatus["Requested"] = "REQUESTED";
    JobStatus["PendingAcceptance"] = "PENDING_ACCEPTANCE";
    JobStatus["Assigned"] = "ASSIGNED";
    JobStatus["OnRoute"] = "ON_ROUTE";
    JobStatus["Inspection"] = "INSPECTION";
    JobStatus["InProgress"] = "IN_PROGRESS";
    JobStatus["Completed"] = "COMPLETED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var FacilityType;
(function (FacilityType) {
    FacilityType["RESIDENTIAL"] = "RESIDENTIAL";
    FacilityType["COMMERCIAL"] = "COMMERCIAL";
    FacilityType["INDUSTRIAL"] = "INDUSTRIAL";
    // Backward-compatibility aliases
    FacilityType["Residential"] = "RESIDENTIAL";
    FacilityType["Commercial"] = "COMMERCIAL";
    FacilityType["Industrial"] = "INDUSTRIAL";
})(FacilityType || (exports.FacilityType = FacilityType = {}));
var ServicePillar;
(function (ServicePillar) {
    ServicePillar["HARD"] = "HARD";
    ServicePillar["SOFT"] = "SOFT";
    ServicePillar["STRATEGIC"] = "STRATEGIC";
    // Backward-compatibility aliases
    ServicePillar["Hard"] = "HARD";
    ServicePillar["Soft"] = "SOFT";
    ServicePillar["Strategic"] = "STRATEGIC";
})(ServicePillar || (exports.ServiceType = exports.ServicePillar = ServicePillar = {}));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "BASIC";
    SubscriptionTier["PLUS"] = "PLUS";
    SubscriptionTier["PREMIUM"] = "PREMIUM";
    // Backward-compatibility aliases
    SubscriptionTier["Basic"] = "BASIC";
    SubscriptionTier["Plus"] = "PLUS";
    SubscriptionTier["Premium"] = "PREMIUM";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["CUSTOMER_CARE"] = "CUSTOMER_CARE";
    Role["CUSTOMER"] = "CUSTOMER";
    Role["WORKER"] = "WORKER";
    // Backward-compatibility aliases
    Role["Admin"] = "ADMIN";
    Role["CustomerCare"] = "CUSTOMER_CARE";
    Role["Customer"] = "CUSTOMER";
    Role["Worker"] = "WORKER";
})(Role || (exports.Role = Role = {}));
// ==========================================
// Location / Spatial Schemas
// ==========================================
exports.locationCoordinatesSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
// ==========================================
// Core Entity Schemas & Types
// ==========================================
// Base User Schema
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    fullName: zod_1.z.string().min(2, 'Full name is required.'),
    email: zod_1.z.string().email('Invalid email address.'),
    role: zod_1.z.nativeEnum(Role),
    phoneNumber: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().optional(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
});
// Worker Schema (Extends User with internal rating 1-5, location, pillars, status)
exports.workerSchema = exports.userSchema.extend({
    rating: zod_1.z.number().min(1).max(5).default(5),
    location: exports.locationCoordinatesSchema.optional(),
    servicePillars: zod_1.z.array(zod_1.z.nativeEnum(ServicePillar)).default([]),
    isAvailable: zod_1.z.boolean().default(true),
    activeJobs: zod_1.z.number().int().nonnegative().default(0),
});
// Customer Schema (Extends User with facility type and subscription tier)
exports.customerSchema = exports.userSchema.extend({
    facilityType: zod_1.z.nativeEnum(FacilityType),
    subscriptionTier: zod_1.z.nativeEnum(SubscriptionTier),
    facilityLocation: exports.locationCoordinatesSchema.optional(),
});
// Service Request Schema (Core Job Ticket)
exports.serviceRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().min(3, 'Title is required.'),
    description: zod_1.z.string().min(5, 'Description is required.'),
    servicePillar: zod_1.z.nativeEnum(ServicePillar),
    facilityType: zod_1.z.nativeEnum(FacilityType),
    status: zod_1.z.nativeEnum(JobStatus).default(JobStatus.REQUESTED),
    customerId: zod_1.z.string(),
    workerId: zod_1.z.string().optional().nullable(),
    location: exports.locationCoordinatesSchema,
    scheduledFor: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional().nullable(),
    quoteAmount: zod_1.z.number().nonnegative().optional().nullable(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional(),
});
// ==========================================
// Auth & Form Schemas
// ==========================================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Enter a valid email address.'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long.'),
});
exports.registrationSchema = zod_1.z
    .object({
    fullName: zod_1.z.string().trim().min(2, 'Full name is required.'),
    email: zod_1.z.string().trim().email('Enter a valid email address.'),
    phoneNumber: zod_1.z.string().trim().min(7, 'Enter a valid phone number.').optional().or(zod_1.z.literal('')),
    role: zod_1.z.nativeEnum(Role).default(Role.CUSTOMER),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: zod_1.z.string().min(8, 'Confirm the password.'),
    companyName: zod_1.z.string().trim().min(2, 'Company name is required.').optional().or(zod_1.z.literal('')),
    acceptTerms: zod_1.z.boolean().refine((value) => value, {
        message: 'Accept the terms to continue.',
    }),
})
    .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
});
