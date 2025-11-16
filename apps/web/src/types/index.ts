// Core types for GiddyApp
// Clean, type-safe interfaces with no shortcuts

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  verified: boolean
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN',
}

export interface Horse {
  id: string
  name: string
  breed: string
  age: number
  gender: Gender
  color: string
  height: number // in hands
  price: number
  description: string
  location: Location
  images: HorseImage[]
  videos: HorseVideo[]
  health: HealthRecords
  training: TrainingHistory
  seller: User
  status: ListingStatus
  views: number
  favorites: number
  createdAt: Date
  updatedAt: Date
}

export enum Gender {
  MARE = 'MARE',
  GELDING = 'GELDING',
  STALLION = 'STALLION',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  REMOVED = 'REMOVED',
}

export interface Location {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude: number
  longitude: number
}

export interface HorseImage {
  id: string
  url: string
  caption?: string
  isPrimary: boolean
  order: number
}

export interface HorseVideo {
  id: string
  url: string
  thumbnail: string
  caption?: string
  duration: number
  order: number
}

export interface HealthRecords {
  coggins: Document | null
  vaccination: Document[]
  veterinaryExams: VetExam[]
  injuries: Injury[]
  medications: Medication[]
}

export interface Document {
  id: string
  name: string
  url: string
  date: Date
  expiresAt?: Date
}

export interface VetExam {
  id: string
  date: Date
  veterinarian: string
  type: ExamType
  findings: string
  documents: Document[]
}

export enum ExamType {
  ROUTINE = 'ROUTINE',
  PPE = 'PPE',
  LAMENESS = 'LAMENESS',
  REPRODUCTIVE = 'REPRODUCTIVE',
  DENTAL = 'DENTAL',
}

export interface Injury {
  id: string
  date: Date
  description: string
  treatment: string
  recovered: boolean
  recoveryDate?: Date
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: Date
  endDate?: Date
  reason: string
}

export interface TrainingHistory {
  discipline: Discipline[]
  level: TrainingLevel
  competitions: Competition[]
  trainers: Trainer[]
}

export enum Discipline {
  DRESSAGE = 'DRESSAGE',
  JUMPING = 'JUMPING',
  EVENTING = 'EVENTING',
  WESTERN = 'WESTERN',
  TRAIL = 'TRAIL',
  ENDURANCE = 'ENDURANCE',
  RACING = 'RACING',
  DRIVING = 'DRIVING',
  OTHER = 'OTHER',
}

export enum TrainingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL',
}

export interface Competition {
  id: string
  name: string
  date: Date
  discipline: Discipline
  placement: string
  notes?: string
}

export interface Trainer {
  id: string
  name: string
  contact?: string
  startDate: Date
  endDate?: Date
}

export interface SearchFilters {
  breed?: string[]
  minPrice?: number
  maxPrice?: number
  minAge?: number
  maxAge?: number
  gender?: Gender[]
  discipline?: Discipline[]
  trainingLevel?: TrainingLevel[]
  location?: {
    latitude: number
    longitude: number
    radius: number // in miles
  }
  keywords?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  recipientId: string
  content: string
  read: boolean
  createdAt: Date
}

export interface Conversation {
  id: string
  participants: User[]
  horse: Horse
  lastMessage: Message
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Offer {
  id: string
  horseId: string
  buyerId: string
  sellerId: string
  amount: number
  status: OfferStatus
  message?: string
  expiresAt: Date
  createdAt: Date
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED',
  EXPIRED = 'EXPIRED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Transaction {
  id: string
  horseId: string
  buyerId: string
  sellerId: string
  amount: number
  fees: TransactionFees
  status: TransactionStatus
  escrowId?: string
  completedAt?: Date
  createdAt: Date
}

export interface TransactionFees {
  buyerPremium: number
  sellerFee: number
  processingFee: number
  total: number
}

export enum TransactionStatus {
  INITIATED = 'INITIATED',
  ESCROW_PENDING = 'ESCROW_PENDING',
  ESCROW_FUNDED = 'ESCROW_FUNDED',
  PPE_SCHEDULED = 'PPE_SCHEDULED',
  PPE_COMPLETE = 'PPE_COMPLETE',
  SHIPPING_ARRANGED = 'SHIPPING_ARRANGED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}