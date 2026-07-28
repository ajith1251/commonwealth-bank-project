/** Matches the backend Goal model returned by /api/Goal */
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
