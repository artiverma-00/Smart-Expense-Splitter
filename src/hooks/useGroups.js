"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get("/api/groups");
      setGroups(res.data.groups);
    } catch {
      toast.error("Failed to load groups");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const createGroup = async (name, description) => {
    const res = await axios.post("/api/groups", { name, description });
    setGroups((prev) => [res.data.group, ...prev]);
    return res.data.group;
  };

  const addMember = async (groupId, email) => {
    const res = await axios.patch(`/api/groups/${groupId}`, { email });
    setGroups((prev) =>
      prev.map((g) => (g._id === groupId ? res.data.group : g)),
    );
    return res.data.group;
  };

  const updateGroup = async (groupId, payload) => {
    const res = await axios.patch(`/api/groups/${groupId}`, payload);
    setGroups((prev) =>
      prev.map((g) => (g._id === groupId ? res.data.group : g)),
    );
    return res.data.group;
  };

  const deleteGroup = async (groupId) => {
    await axios.delete(`/api/groups/${groupId}`);
    setGroups((prev) => prev.filter((g) => g._id !== groupId));
  };

  useEffect(() => {
    fetchGroups();

    const intervalId = window.setInterval(() => {
      fetchGroups({ silent: true });
    }, 30000);

    const handleFocus = () => {
      fetchGroups({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchGroups]);

  return {
    groups,
    loading,
    fetchGroups,
    createGroup,
    addMember,
    updateGroup,
    deleteGroup,
  };
}
