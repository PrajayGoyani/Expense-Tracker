/**
  Expense Tracker
*/

import { write } from 'bun';

type Expense = {
  amount: number; // in cents
  notes: string;
}

type User = {
  id: number;
  name: string;
  expenses: Expense[];
  expense_total: number;
  settlement_amt: number;
  is_settled: boolean;
}

type Transaction = {
  id: string; // uuid
  amount: number;
  status: "paid" | "unpaid" | null;
  payment_method: "cash" | "online"
  payeeId: number;
  payerId: number;
  notes: string | null;
}

type Settlements = Transaction[];

type Trip = {
  name: string;
  description: string;
  users: User[];
  total_users: number;
  expense_per_user: number;
  total_user_expense: number;
  is_settled: boolean;
  settlements: Settlements;
}

const config = {
  MIN_EXPENSE_AMT: 200,
  MAX_EXPENSE_AMT: 1000,
  MIN_EXPENSE_COUNT: 2,
  MAX_EXPENSE_COUNT: 8,
  USER_NAMES: [
    "Arjun Mehta", "Priya Patel", "Rohan Shah", "Nisha Desai", "Kiran Joshi",
    "Sneha Trivedi", "Vivek Pandya", "Pooja Bhatt", "Manish Parikh", "Ritu Kapoor",
    "Dhruv Amin", "Kavya Modi", "Sanjay Thakkar", "Anjali Vora", "Harsh Solanki",
    "Mital Raval", "Chirag Nayak", "Swati Gandhi", "Yash Contractor", "Foram Chauhan"
  ],
  EXPENSE_NOTES: [
    "Khaman", "Lunch", "Groceries", "Auto Fare", "Coffee",
    "Dinner", "Stationery", "Medicine", "Snacks", "Petrol",
    "Electricity Bill", "Mobile Recharge", "Parking", "Chai", "Courier",
    "Vegetables", "Fruit", "Books", "Laundry", "Bus Ticket"
  ],
  getTotalUser() { return this.USER_NAMES.length; }
}

function generateRandomNote() {
  return config.EXPENSE_NOTES[Math.floor(Math.random() * config.EXPENSE_NOTES.length)];
}

function generateRandomNumber({ min, max }: { min: number, max: number }) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUser(id: number, availableNames: string[]): User {
  return {
    id: id,
    name: availableNames[id - 1],
    expenses: [],
    expense_total: 0,
    settlement_amt: 0,
    is_settled: false,
  }
}

function generateExpense() {
  return {
    amount: generateRandomNumber({
      min: config.MIN_EXPENSE_AMT,
      max: config.MAX_EXPENSE_AMT
    }) * 100,
    notes: generateRandomNote()
  };
}

function getAllUserTotalExpense(users: User[]) {
  let total = 0;
  for (const user of users) {
    total += user.expense_total;
  }
  return total;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function generateUserExpense(): Expense[] {
  const expenses: Expense[] = [];
  const expenseCount = generateRandomNumber({ min: config.MIN_EXPENSE_COUNT, max: config.MAX_EXPENSE_COUNT });
  for (let i = 0; i < expenseCount; i++) {
    expenses.push(generateExpense());
  }
  return expenses;
}

function calculateTotalExpense(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function generateUsersWithExpense(count: number) {
  const totalUser = config.getTotalUser();
  if (count > totalUser) {
    throw new Error(`Can not generate more than available seed users, totalUser: ${totalUser}`);
  }

  const availableNames = shuffle(config.USER_NAMES);

  const users = [];
  for (let i = 0; i < count; i++) {
    // Get initial user state
    const user = generateUser(i + 1, availableNames);

    // Generate user expenses
    user.expenses = generateUserExpense();
    user.expense_total = calculateTotalExpense(user.expenses)

    users.push(user);
  }

  return users;
}

function generateUUID() {
  return crypto.randomUUID();
}


function settleExpenses(trip: Trip) {
  const settledTrip = structuredClone(trip)

  const users = settledTrip.users;
  const expensePerUser = settledTrip.expense_per_user;

  for (const user of users) {
    user.settlement_amt = user.expense_total - expensePerUser;
  }

  // creditors and debtors by remaining amount, highest first
  const creditors = users.filter(u => u.settlement_amt > 0)
    .map(u => ({ user: u, remaining: u.settlement_amt }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = users.filter(u => u.settlement_amt < 0)
    .map(u => ({ user: u, remaining: Math.abs(u.settlement_amt) }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = settledTrip.settlements;

  let ci = 0; // creditor index
  let di = 0; // debtor index

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const settleAmount = Math.min(creditor.remaining, debtor.remaining);
    const transactionId = generateUUID();

    // log settlements
    settlements.push({
      id: transactionId,
      amount: settleAmount,
      status: "unpaid",
      payment_method: "online",
      payeeId: creditor.user.id,
      payerId: debtor.user.id,
      notes: `settle amount from ${debtor.user.name} to ${creditor.user.name}`,
    });

    creditor.remaining -= settleAmount;
    debtor.remaining -= settleAmount;
    creditor.user.settlement_amt -= settleAmount;
    debtor.user.settlement_amt += settleAmount;

    if (creditor.remaining === 0) ci++;
    if (debtor.remaining === 0) di++;
  }

  // check total remaining
  const remainingBalance = users.reduce((sum, user) => sum + user.settlement_amt, 0);
  if (remainingBalance !== 0) {
    throw new Error(`Settlement incomplete: ${remainingBalance}`);
  }

  // all remaining balance is settled
  for (const user of users) {
    user.is_settled = true;
  }

  settledTrip.is_settled = users.every(u => u.is_settled);

  return settledTrip;
}

try {
  // Generate user with expense
  const users = generateUsersWithExpense(5);
  const totalExpense = getAllUserTotalExpense(users);
  const expensePerUser = totalExpense / users.length;

  const trip: Trip = {
    name: "Manali",
    description: "Solang Valley, Beas River, Hidimba Devi Temple",
    users: users,
    total_users: users.length,
    expense_per_user: expensePerUser,
    total_user_expense: totalExpense,
    settlements: [],
    is_settled: false,
  };

  const settledTrip = settleExpenses(trip);

  await write("./data.json", JSON.stringify(settledTrip, null, 2));
} catch (e: any) {
  console.error(`Generate Expense error: ${e?.message ?? e}`, e?.stack);
}
