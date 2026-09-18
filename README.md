# Expense Tracker & Debt Settlement

A lightweight, zero-dependency group expense tracker and debt simplification engine designed for a coding challenge. The application simulates shared group travel expenses and simplifies peer-to-peer repayments to resolve balances with minimal transactions.

---

## Features

- **Automated Mock Generator**: Creates random trip participants and categorized expense entries (2–8 items per user).
- **Splitwise-Style Debt Settlement**: Uses a greedy two-pointer matching algorithm to minimize the total number of transactions needed to settle all debts.
- **Integrity Checks**:
  - Confirms net settlement balance across all participants sums to zero.
- **File Output**: Automatically serializes the settled trip state into `data.json`.

---

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Running the Project

Build and run the project using the package scripts:

```bash
# Build the project
bun run build

# Start the bundled script
bun run execute
```

The script will simulate the trip expenses, compute settlements, validate the balance, and write the output to `data.json`.
