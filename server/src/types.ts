/** Represents a financial goal with an optional emoji icon */
export interface Goal {
  id: string
  name: string
  targetAmount: number
  targetDate: string
  balance: number
  created: string
  accountId: string | null
  transactionIds: string[] | null
  tagIds: string[] | null
  icon: string | null
  userId: string
}

/** Represents a user account */
export interface User {
  id: string
  name: string
  email: string
  password: string
  accountIds: string[] | null
  goalIds: string[] | null
  transactionIds: string[] | null
}

/** Represents a bank account */
export interface Account {
  id: string
  number: number
  name: string
  balance: number
  accountType: string
  transactionIds: string[] | null
}

/** Represents a financial transaction (debit or credit) */
export interface Transaction {
  id: string
  description: string
  amount: number
  transactionType: 'Debit' | 'Credit'
  dateTime: string
  goalId: string | null
  tagIds: string[] | null
  userId: string
}

/** Represents a tag/label for categorisation */
export interface Tag {
  id: string
  name: string
}
