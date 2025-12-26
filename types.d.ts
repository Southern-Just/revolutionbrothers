export type UserRole = "chairperson" | "secretary" | "treasurer" | "member";
export type TransactionStatus = "verified" | "pending" | "declined";
export type TransactionType = "credit" | "debit";

export interface userAuth {
  id: string;
  email: string;
  passwordHash: string;
  pin: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileRow {
  id: string;
  userId: string;
  name: string;
  username: string;
  nationalId: string;
  phone: string | null;
  profileImage: string | null;
}

export interface SessionRow {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface TransactionRow {
  id: string;
  userId: string;
  name: string;
  month: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  transactionCode: string;
  occurredAt: Date;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  username: string;
  nationalId: string;
  phone?: string;
  profileImage?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  name: string;
  month: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  transactionCode: string;
  occurredAt: string;
  createdAt?: string;
}

export interface Member {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface MemberWithProfile extends Member {
  name: string;
  username: string;
  nationalId: string;
  phone?: string;
  profileImage?: string;
}

export interface MemberWithTransactions extends MemberWithProfile {
  contributions: Transaction[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  pin: string;
}

export interface UpdateMemberInput {
  role?: UserRole;
  name?: string;
  username?: string;
  phone?: string;
  profileImage?: string;
}

export interface UpdateTransactionInput {
  name?: string;
  amount?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  occurredAt?: string;
}
