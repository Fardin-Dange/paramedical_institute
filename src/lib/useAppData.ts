import { useCallback, useEffect, useState } from "react";

import {
  defaultSettings,
  type Expense,
  type Payment,
  type Settings,
  type Student,
} from "./store";
import { getExpensesFn } from "./expenses";
import { getPaymentsFn } from "./payments";
import { getStudentsFn } from "./students";
import { getSettingsFn } from "./settings";

export function useAppData() {
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStudentsError(null);
      setStudents(await getStudentsFn());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load students from the database.";

      console.error("Failed to load students:", error);
      setStudentsError(message);
    }

    try {
      setPaymentsError(null);
      setPayments(await getPaymentsFn());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load payments from the database.";

      console.error("Failed to load payments:", error);
      setPaymentsError(message);
    }

    try {
      setExpensesError(null);
      setExpenses(await getExpensesFn());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load expenses from the database.";

      console.error("Failed to load expenses:", error);
      setExpensesError(message);
    }

    try {
      setSettingsError(null);
      setSettings(await getSettingsFn());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load settings from the database.";

      console.error("Failed to load settings:", error);
      setSettingsError(message);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void refresh();

    const onChange = () => {
      setTick((t) => t + 1);
      void refresh();
    };

    window.addEventListener("ifms-change", onChange);
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener("ifms-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return {
    mounted,
    tick,
    students: mounted ? students : [],
    studentsError,
    payments: mounted ? payments : [],
    paymentsError,
    expenses: mounted ? expenses : [],
    expensesError,
    settings,
    settingsError,
    refresh,
  };
}
