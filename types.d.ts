/* ----------------user.actions ---------------- */

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  pin: string;
};
/* ---------------- user.transactions. TYPES ---------------- */

export type TransactionDTO = {
  id: string;
  userId: string;
  name: string;
  month: string;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateTransactionInput = {
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  transactionCode: string;
  occurredAt: Date;
};

export type UpdateTransactionInput = Partial<{
  month: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  occurredAt: Date;
  status: "pending" | "verified" | "declined";
}>;

/* ---------------- user.systeme. TYPES ---------------- */

export type MemberDTO = {
  userId: string;
  name: string;
  role: string;
  username: string | null;
  phone: string | null;
  profileImage: string | null;
};

export type MyProfile = {
  email: string;
  name: string;
  username: string;
  phone: string;
  nationalId: string;
  profileImage?: string | null;
  role: "chairperson" | "secretary" | "treasurer" | "member";
};

export type UpdateUserProfileInput = Partial<MyProfile>;


// admin transaction
export type TransactionStatus = "pending" | "verified" | "declined";
export type TransactionType = "credit" | "debit";

export type BulkTransactionInput = {
  userId: string;
  month: string;
  amount: number;
  type: TransactionType;
  category: string;
  transactionCode: string;
  occurredAt: Date;
  status: TransactionStatus;
};