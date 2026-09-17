/**

type Expense = {
  amount: number;
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

type Trip = {
  name: string;
  description: string;
  users: User[];
  total_users: number;
  expense_per_user: number;
  total_user_expense: number;
  is_settled: boolean;
  settlments: Settlments;
}

type Reciept = {
  settled_to: Partial<User>;
  payment_method: "cash" | "online"
}

type Transaction = {
  id: string; // "MN-12345"
  amount: number;
  status: "paid" | "unpaid" | null;
  reciept: Reciept;
}

type Settlments = {
  in: Transaction[];
  out: Transaction[];
}

*/
const MIN_EXPENSE = 200;
const MAX_EXPENSE = 1000;

const USER_NAMES = [
  "Arjun Mehta", "Priya Patel", "Rohan Shah", "Nisha Desai", "Kiran Joshi",
  "Sneha Trivedi", "Vivek Pandya", "Pooja Bhatt", "Manish Parikh", "Ritu Kapoor",
  "Dhruv Amin", "Kavya Modi", "Sanjay Thakkar", "Anjali Vora", "Harsh Solanki",
  "Mital Raval", "Chirag Nayak", "Swati Gandhi", "Yash Contractor", "Foram Chauhan"
];

const totalUser = USER_NAMES.length;

let userNameIndex = 0;
function generateRandomUserName() {
  userNameIndex = Math.floor(Math.random() * USER_NAMES.length);
  const name = USER_NAMES[userNameIndex];
  USER_NAMES.splice(userNameIndex, 1);
  return name;
}

const EXPENSE_NOTES = [
  "Khaman", "Lunch", "Groceries", "Auto Fare", "Coffee",
  "Dinner", "Stationery", "Medicine", "Snacks", "Petrol",
  "Electricity Bill", "Mobile Recharge", "Parking", "Chai", "Courier",
  "Vegetables", "Fruit", "Books", "Laundry", "Bus Ticket"
];

function generateRandomNote() {
  return EXPENSE_NOTES[Math.floor(Math.random() * EXPENSE_NOTES.length)];
}

function generateRandomNumber({ min, max }) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUser(id) {
  return {
    id: id,
    name: generateRandomUserName(),
    expenses: [],
    expense_total: 0,
    settlement_amt: 0,
    is_settled: false,
  }
}

function generateExpense() {
  return {
    amount: generateRandomNumber({ min: MIN_EXPENSE, max: MAX_EXPENSE }) * 100,
    notes: generateRandomNote()
  };
}

function getAllUserTotalExpense(users) {
  let total = 0;
  for (const user of users) {
    total += user.expense_total;
  }
  return total;
}

function generateUsersWithExpense(count) {
  if (count > totalUser) {
    throw new Error(`Can not generate more than available seed users, totalUser: ${totalUser}`);
  }

  const users = [];
  for (let i = 0; i < count; i++) {
    // Get initial user state
    const user = generateUser(i + 1);

    // Generate user expenses
    const expenseCount = generateRandomNumber({ min: 2, max: 8 });
    for (let i = 0; i < expenseCount; i++) {
      const expense = generateExpense();
      user.expense_total += expense.amount;
      user.expenses.push(expense);
    }

    users.push(user);
  }

  return users;
}

function calculateSettlementAmt({ user, expensePerUser }) {
  return user.expense_total - expensePerUser;
}

function generateTransactionId(tripName) {
  return crypto.randomUUID();
  // const prefix = tripName.slice(0, 2).toUpperCase();
  // return prefix + "-" + Math.floor(10000 + Math.random() * 90000);
}

function settleExpenses(trip) {
  const settledTrip = structuredClone(trip)

  const users = settledTrip.users;
  const expensePerUser = settledTrip.expense_per_user;

  for (const user of users) {
    user.settlement_amt = calculateSettlementAmt({ user, expensePerUser });
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
    const transactionId = generateTransactionId(_trip.name);

    // Creditor receives money (IN)
    settlements.in.push({
      id: transactionId,
      amount: settleAmount,
      status: "unpaid",
      receipt: {
        settled_to: { id: creditor.user.id, name: creditor.user.name },
        payment_method: "online",
      },
      from: { id: debtor.user.id, name: debtor.user.name },
    });

    // Debtor sends money (OUT)
    settlements.out.push({
      id: transactionId,
      amount: settleAmount,
      status: "unpaid",
      receipt: {
        settled_to: { id: creditor.user.id, name: creditor.user.name },
        payment_method: "online",
      },
      from: { id: debtor.user.id, name: debtor.user.name },
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

  // match in out settlements
  const totalIn = settlements.in.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalOut = settlements.out.reduce( (sum, transaction) => sum + transaction.amount, 0);
  if (totalIn !== totalOut) {
    throw new Error("IN and OUT settlements don't match");
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

  const trip = {
    name: "Manali",
    description: "Solang Valley, Beas River, Hidimba Devi Temple",
    users: users,
    total_users: users.length,
    expense_per_user: expensePerUser,
    total_user_expense: totalExpense,
    settlements: { in: [], out: [] },
    is_settled: false,
  };

  const settledTrip = settleExpenses(trip);

  await Bun.write("./data.json", JSON.stringify(settledTrip, null, 2));
} catch (e) {
  console.error(`Generate Expense error: ${e.message}`, e.stack);
}
