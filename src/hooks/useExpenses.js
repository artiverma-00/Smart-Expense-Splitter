"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useExpenses(groupId) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(
    async ({ silent = false } = {}) => {
      if (!groupId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(`/api/groups/${groupId}/expenses`);
        setExpenses(res.data.expenses);
      } catch {
        toast.error("Failed to load expenses");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groupId],
  );

  const addExpense = async (data) => {
    const res = await axios.post(`/api/groups/${groupId}/expenses`, data);
    setExpenses((prev) => [res.data.expense, ...prev]);
    return res.data.expense;
  };

  const deleteExpense = async (expenseId) => {
    await axios.delete(`/api/expenses/${expenseId}`);
    setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
  };

  useEffect(() => {
    fetchExpenses();

    const intervalId = window.setInterval(() => {
      fetchExpenses({ silent: true });
    }, 30000);

    const handleFocus = () => {
      fetchExpenses({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchExpenses]);

  return { expenses, loading, fetchExpenses, addExpense, deleteExpense };
}
