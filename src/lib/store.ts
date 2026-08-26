// Simple localStorage-backed data store for the Institute Fee Management MVP.

export type Payment = {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  date: string; // yyyy-mm-dd
  mode: "Cash" | "UPI" | "Bank Transfer";
  upiReference?: string;
  nextDueDate: string;
  remainingAfter: number;
  previouslyPaid: number;
};

export const COURSE_OPTIONS = [
  "PGDMLT / ADMLT",
  "DMLT",
  "Radiology",
  "Operation Theatre",
  "Optometrist",
  "Dialysis",
  "X-Ray, CT, MRI",
  "Sanitary Inspector",
  "B.Sc. (Micro)",
  "Hotel Management",
] as const;

export const BATCH_OPTIONS = Array.from(
  { length: 10 },
  (_, i) => `Batch ${i + 1}`,
) as string[];

export type Student = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  course: string;
  batch: string;
  admissionDate: string;
  instalmentDate: string;
  totalFee: number;
  paidFee: number;
  nextDueDate: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  note: string;
};

export type Settings = {
  instituteName: string;
  logo: string; // data url or image path
  address: string;
  mobile: string;
  email: string;
};

const KEYS = {
  students: "ifms_students",
  payments: "ifms_payments",
  expenses: "ifms_expenses",
  settings: "ifms_settings",
  auth: "ifms_auth",

  // Version changed so old demo data is removed once.
  seeded: "ifms_seeded_v2",
};

export const isBrowser = () => typeof window !== "undefined";

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export const todayISO = () => iso(new Date());

export const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const formatINR = (n: number) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN");

export const formatDate = (s: string) => {
  if (!s) return "—";

  const d = new Date(s + "T00:00:00");

  if (isNaN(d.getTime())) return s;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export type DueStatus =
  | "Paid"
  | "Due Today"
  | "Due Tomorrow"
  | "Upcoming"
  | "Overdue"
  | "No Due";

export function dueStatus(student: Student): DueStatus {
  const remaining = student.totalFee - student.paidFee;

  if (remaining <= 0) return "Paid";

  if (!student.nextDueDate) return "No Due";

  const t = todayISO();

  if (student.nextDueDate === t) return "Due Today";

  if (student.nextDueDate === addDays(1)) return "Due Tomorrow";

  return student.nextDueDate < t ? "Overdue" : "Upcoming";
}

export const remainingOf = (s: Student) =>
  Math.max(0, s.totalFee - s.paidFee);

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = localStorage.getItem(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;

  localStorage.setItem(key, JSON.stringify(value));

  window.dispatchEvent(new Event("ifms-change"));
}

// -----------------------------------------
// Institute Settings
// -----------------------------------------

export const defaultSettings: Settings = {
  instituteName: "Renuka Paramedical Institute",

  // Image from public/logo.png
  logo: "/logo.png",

  address:
    "Shree Bussiness Building, First Floor, Chinchkar Chowk, Pragatinagar, Baramati, Maharashtra 413102",

  mobile: "+91 913048003",

  email: "renukaparamedical@gmai.com",
};

// -----------------------------------------
// Initial Data
// -----------------------------------------
//
// IMPORTANT:
// There are NO demo students.
// There are NO demo payments.
//
// Admin will add students manually from:
// Students → Add Student
//
// The v2 key also makes sure old demo data from
// the previous version is cleared once.
// -----------------------------------------

function seed() {
  if (!isBrowser()) return;

  // Already initialized with the new version
  if (localStorage.getItem(KEYS.seeded)) return;

  // Start with completely empty data
  const students: Student[] = [];

  const payments: Payment[] = [];
  const expenses: Expense[] = [];

  // Remove old demo/sample data from previous version
  localStorage.removeItem("ifms_students");
  localStorage.removeItem("ifms_payments");
  localStorage.removeItem(KEYS.expenses);

  // Save empty student list
  localStorage.setItem(
    KEYS.students,
    JSON.stringify(students)
  );

  // Save empty payment list
  localStorage.setItem(
    KEYS.payments,
    JSON.stringify(payments)
  );

  localStorage.setItem(KEYS.expenses, JSON.stringify(expenses));

  // Save institute settings
  localStorage.setItem(
    KEYS.settings,
    JSON.stringify(defaultSettings)
  );

  // Mark application as initialized
  localStorage.setItem(KEYS.seeded, "1");
}

// -----------------------------------------
// Students
// -----------------------------------------

export function getStudents(): Student[] {
  seed();

  return read<Student[]>(KEYS.students, []);
}

// -----------------------------------------
// Payments
// -----------------------------------------

export function getPayments(): Payment[] {
  seed();

  return read<Payment[]>(KEYS.payments, []);
}

// -----------------------------------------
// Expenses
// -----------------------------------------

export function getExpenses(): Expense[] {
  seed();
  return read<Expense[]>(KEYS.expenses, []);
}

export function saveExpense(expense: Expense) {
  const expenses = getExpenses();
  const idx = expenses.findIndex((e) => e.id === expense.id);
  if (idx >= 0) expenses[idx] = expense;
  else expenses.unshift(expense);
  write(KEYS.expenses, expenses);
}

export function deleteExpense(id: string) {
  write(KEYS.expenses, getExpenses().filter((e) => e.id !== id));
}

// -----------------------------------------
// Settings
// -----------------------------------------

export function getSettings(): Settings {
  seed();

  return {
    ...defaultSettings,
    ...read<Partial<Settings>>(KEYS.settings, {}),
  };
}

export function saveSettings(s: Settings) {
  write(KEYS.settings, s);
}

// -----------------------------------------
// Generate Next Student ID
// -----------------------------------------

export function nextStudentId(students: Student[]) {
  const max = students.reduce((m, s) => {
    const n = parseInt(s.id.replace(/\D/g, ""), 10);

    return isNaN(n) ? m : Math.max(m, n);
  }, 0);

  return "STU-" + String(max + 1).padStart(3, "0");
}

// -----------------------------------------
// Add / Update Student
// -----------------------------------------

export function saveStudent(student: Student) {
  const students = getStudents();

  const idx = students.findIndex(
    (s) => s.id === student.id
  );

  if (idx >= 0) {
    // Update existing student
    students[idx] = student;
  } else {
    // Add new student
    students.push(student);
  }

  write(KEYS.students, students);
}

// -----------------------------------------
// Delete Student
// -----------------------------------------

export function deleteStudent(id: string) {
  write(
    KEYS.students,
    getStudents().filter((s) => s.id !== id)
  );

  write(
    KEYS.payments,
    getPayments().filter(
      (p) => p.studentId !== id
    )
  );
}

// -----------------------------------------
// Add Payment
// -----------------------------------------

export function addPayment(input: {
  studentId: string;
  amount: number;
  date: string;
  mode: Payment["mode"];
  nextDueDate: string;
  upiReference?: string;
}): Payment {
  const students = getStudents();

  const student = students.find(
    (s) => s.id === input.studentId
  );

  if (!student) {
    throw new Error("Student not found");
  }

  const payments = getPayments();

  const maxReceipt = payments.reduce((max, p) => {
    const n = parseInt(p.receiptNo.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 1000);
  const receiptNo = "RCP-" + String(maxReceipt + 1);

  const previouslyPaid = student.paidFee;

  const newPaid =
    previouslyPaid + input.amount;

  const payment: Payment = {
    id: "P" + Date.now(),

    receiptNo,

    studentId: student.id,

    amount: input.amount,

    date: input.date,

    mode: input.mode,

    upiReference: input.upiReference?.trim() || undefined,

    nextDueDate: input.nextDueDate,

    previouslyPaid,

    remainingAfter: Math.max(
      0,
      student.totalFee - newPaid
    ),
  };

  // Update student's paid amount
  student.paidFee = newPaid;

  // If complete payment is done,
  // there is no next due date.
  student.nextDueDate =
    newPaid >= student.totalFee
      ? ""
      : input.nextDueDate;

  // Save updated students
  write(
    KEYS.students,
    students
  );

  // Save payment
  write(
    KEYS.payments,
    [payment, ...payments]
  );

  return payment;
}

// -----------------------------------------
// Update / Delete Payment
// -----------------------------------------

function recalculateStudentPayments(studentId: string) {
  const students = getStudents();
  const payments = getPayments();
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const related = payments.filter((p) => p.studentId === studentId).sort((a, b) =>
    a.date === b.date ? a.id.localeCompare(b.id) : a.date.localeCompare(b.date)
  );

  let paid = 0;
  related.forEach((p) => {
    p.previouslyPaid = paid;
    paid += Number(p.amount) || 0;
    p.remainingAfter = Math.max(0, student.totalFee - paid);
  });

  student.paidFee = paid;
  const latest = related[related.length - 1];
  student.nextDueDate = paid >= student.totalFee ? "" : (latest?.nextDueDate || "");

  write(KEYS.payments, payments);
  write(KEYS.students, students);
}

export function updatePayment(input: Payment): Payment {
  const payments = getPayments();
  const idx = payments.findIndex((p) => p.id === input.id);
  if (idx < 0) throw new Error("Payment not found");
  const oldStudentId = payments[idx].studentId;
  payments[idx] = { ...input, amount: Number(input.amount) || 0 };
  write(KEYS.payments, payments);
  recalculateStudentPayments(oldStudentId);
  if (input.studentId !== oldStudentId) recalculateStudentPayments(input.studentId);
  const updated = getPayments().find((p) => p.id === input.id);
  if (!updated) throw new Error("Payment update failed");
  return updated;
}

export function deletePayment(id: string) {
  const payments = getPayments();
  const payment = payments.find((p) => p.id === id);
  if (!payment) return;
  write(KEYS.payments, payments.filter((p) => p.id !== id));
  recalculateStudentPayments(payment.studentId);
}

// -----------------------------------------
// Authentication
// -----------------------------------------

export const login = (
  u: string,
  p: string
) => {
  if (
    u.trim().toLowerCase() === "admin" &&
    p === "admin123"
  ) {
    if (isBrowser()) {
      localStorage.setItem(
        KEYS.auth,
        "1"
      );
    }

    return true;
  }

  return false;
};

// -----------------------------------------
// Logout
// -----------------------------------------

export const logout = () => {
  if (isBrowser()) {
    localStorage.removeItem(KEYS.auth);
  }
};

// -----------------------------------------
// Check Login
// -----------------------------------------

export const isLoggedIn = () =>
  isBrowser() &&
  localStorage.getItem(KEYS.auth) === "1";