// src/hooks/useReminders.js
import { useEffect, useState, useCallback } from "react";
import { backendUrl } from "../constant";

const REMINDERS_API_URL = `${backendUrl}/reminders`;


export function useReminders(workspaceType) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${REMINDERS_API_URL}?type=${workspaceType}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load reminders");
      }

      setReminders(data.data || []);
    } catch (err) {
      console.error("💥 fetchReminders error:", err);
      setError(err.message || "Something went wrong while loading reminders");
    } finally {
      setLoading(false);
    }
  }, [workspaceType]);

  const addReminder = useCallback(
    async (payload) => {
      const res = await fetch(REMINDERS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type: workspaceType }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to add reminder");
      }

      if (data.data) {
        setReminders((prev) => [...prev, data.data]);
      }

      return data.data;
    },
    [workspaceType]
  );

  const markDoneToday = useCallback(async (id) => {
    // simple PATCH endpoint you’ll build on backend
    const res = await fetch(`${REMINDERS_API_URL}/${id}/done`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data?.message || "Failed to mark reminder done");
    }

    if (data.data) {
      setReminders((prev) =>
        prev.map((r) => (r._id === id ? data.data : r))
      );
    }

    return data.data;
  }, []);

  const updateReminder = useCallback(
    async (id, payload) => {
      const res = await fetch(`${REMINDERS_API_URL}/${id}`, {
        method: "PUT",                       // general update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to update reminder");
      }

      if (data.data) {
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? data.data : r))
        );
      }

      return data.data;
    },
    []
  );

  const deleteReminder = useCallback(async (id) => {
    const res = await fetch(`${REMINDERS_API_URL}/${id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data?.message || "Failed to delete reminder");
    }

    setReminders((prev) => prev.filter((r) => r._id !== id));

    return data.data;
  }, []);

  useEffect(() => {
    if (!workspaceType) return;
    fetchReminders();
  }, [workspaceType, fetchReminders]);

  return {
    reminders,
    loading,
    error,
    addReminder,
    markDoneToday,
    updateReminder, 
    deleteReminder,
    refetch: fetchReminders,
  };
}
