"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AddExpenseModal from "@/components/expenses/AddExpenseModal";
import AddMemberModal from "@/components/groups/AddMemberModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import {
  Trash2,
  Receipt,
  Users,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  X,
} from "lucide-react";

const CATEGORY_COLORS = {
  food: "bg-orange-100 text-orange-700",
  travel: "bg-blue-100 text-blue-700",
  rent: "bg-purple-100 text-purple-700",
  entertainment: "bg-pink-100 text-pink-700",
  utilities: "bg-gray-100 text-gray-700",
  shopping: "bg-yellow-100 text-yellow-700",
  health: "bg-green-100 text-green-700",
  other: "bg-slate-100 text-slate-700",
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const {
    expenses,
    loading: expLoading,
    addExpense,
    deleteExpense,
  } = useExpenses(groupId);
  const [group, setGroup] = useState(null);
  const [settlements, setSettlements] = useState({
    transactions: [],
    balances: {},
  });
  const [loading, setLoading] = useState(true);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatText, setChatText] = useState("");
  const [activeTab, setActiveTab] = useState("expenses");
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletingMessageId, setDeletingMessageId] = useState(null);

  const currentUserId = user?.id || user?._id;
  const isCreator = group?.createdBy?._id === currentUserId;
  const chatSeenStorageKey = useMemo(
    () => `group-chat-last-seen-${groupId}`,
    [groupId],
  );
  const liveTotalSpent =
    expenses.length > 0
      ? Math.round(
          expenses.reduce((sum, expense) => sum + expense.amount, 0) * 100,
        ) / 100
      : group?.totalExpenses || 0;
  const livePerPerson =
    group?.members?.length > 0
      ? Math.round((liveTotalSpent / group.members.length) * 100) / 100
      : 0;

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          axios.get(`/api/groups/${groupId}`),
          axios.get(`/api/settlements?groupId=${groupId}`),
        ]);
        setGroup(gRes.data.group);
        setSettlements(sRes.data);
      } catch {
        toast.error("Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchGroup();
    }, 0);

    return () => clearTimeout(timer);
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !currentUserId) return;

    if (activeTab === "chat") {
      const now = new Date().toISOString();
      window.localStorage.setItem(chatSeenStorageKey, now);
      setUnreadCount(0);
      return;
    }

    const lastSeenAt = window.localStorage.getItem(chatSeenStorageKey);
    const unseen = messages.filter((message) => {
      const isMine = message.sender?._id === currentUserId;
      if (isMine) return false;
      if (!lastSeenAt) return true;
      return new Date(message.createdAt) > new Date(lastSeenAt);
    }).length;

    setUnreadCount(unseen);
  }, [activeTab, messages, currentUserId, groupId, chatSeenStorageKey]);

  useEffect(() => {
    if (!groupId) return;

    const fetchChat = async ({ silent = false } = {}) => {
      if (!silent) setChatLoading(true);
      try {
        const response = await axios.get(`/api/groups/${groupId}/chat`);
        setMessages(response.data.messages || []);
      } catch {
        if (!silent) {
          toast.error("Failed to load chat");
        }
      } finally {
        if (!silent) setChatLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchChat();
    }, 0);

    const intervalId = window.setInterval(() => {
      fetchChat({ silent: true });
    }, 12000);

    const handleFocus = () => {
      fetchChat({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timer);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [groupId]);

  const handleSendMessage = async () => {
    const text = chatText.trim();
    if (!text || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await axios.post(`/api/groups/${groupId}/chat`, {
        text,
      });
      setMessages((prev) => [...prev, response.data.message]);
      setChatText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    setDeletingMessageId(messageId);
    try {
      await axios.delete(`/api/groups/${groupId}/chat/${messageId}`);
      setMessages((prev) =>
        prev.filter((message) => message._id !== messageId),
      );
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleAddMember = async (gId, email) => {
    const res = await axios.patch(`/api/groups/${gId}`, { email });
    setGroup(res.data.group);
  };

  const handleAddExpense = async (data) => {
    const createdExpense = await addExpense(data);
    setGroup((prev) =>
      prev
        ? {
            ...prev,
            totalExpenses:
              Math.round(
                (Number(prev.totalExpenses || 0) +
                  Number(createdExpense.amount || 0)) *
                  100,
              ) / 100,
          }
        : prev,
    );
    return createdExpense;
  };

  const handleDeleteExpense = async (expenseId) => {
    const deletedExpense = expenses.find(
      (expense) => expense._id === expenseId,
    );
    await deleteExpense(expenseId);
    if (!deletedExpense) return;

    setGroup((prev) =>
      prev
        ? {
            ...prev,
            totalExpenses: Math.max(
              0,
              Math.round(
                (Number(prev.totalExpenses || 0) -
                  Number(deletedExpense.amount || 0)) *
                  100,
              ) / 100,
            ),
          }
        : prev,
    );
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!isCreator) return;

    const confirmed = window.confirm("Remove this member from the group?");
    if (!confirmed) return;

    setRemovingMemberId(memberUserId);
    try {
      const res = await axios.patch(`/api/groups/${groupId}`, {
        removeUserId: memberUserId,
      });
      setGroup(res.data.group);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCreator) return;

    const confirmed = window.confirm(
      "Delete this group? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingGroup(true);
    try {
      await axios.delete(`/api/groups/${groupId}`);
      toast.success("Group deleted");
      router.push("/groups");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleSettle = async (toUserId, amount) => {
    try {
      await axios.post("/api/settlements", { groupId, toUserId, amount });
      const sRes = await axios.get(`/api/settlements?groupId=${groupId}`);
      setSettlements(sRes.data);
      toast.success("Settlement recorded!");
    } catch {
      toast.error("Failed to record settlement");
    }
  };

  if (loading)
    return <LoadingSpinner size="lg" label="Loading group details" />;
  if (!group)
    return (
      <p className="mt-20 text-center text-muted-foreground">Group not found</p>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="mt-1 text-muted-foreground">{group.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Add people by email, then split expenses and settle balances here.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <AddMemberModal groupId={groupId} onAdd={handleAddMember} />
          <AddExpenseModal
            groupId={groupId}
            members={group.members}
            onAdd={handleAddExpense}
          />
          {isCreator ? (
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deletingGroup}
            >
              {deletingGroup ? "Deleting..." : "Delete Group"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold">₹{liveTotalSpent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{group.members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold">{expenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Per Person</p>
            <p className="text-2xl font-bold">₹{livePerPerson}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto md:w-fit">
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
            {unreadCount > 0 ? (
              <span className="rounded-full bg-red-500 px-1.5 py-0 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          {expLoading ? (
            <LoadingSpinner label="Loading expenses" />
          ) : expenses.length === 0 ? (
            <Card className="py-10 text-center">
              <CardContent>
                <Receipt className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No expenses yet. Add the first one!
                </p>
              </CardContent>
            </Card>
          ) : (
            expenses.map((exp) => (
              <Card key={exp._id} className="transition-shadow hover:shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid by {exp.paidBy.name} ·{" "}
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{exp.amount}</p>
                        <Badge
                          className={`text-xs capitalize ${CATEGORY_COLORS[exp.category]}`}
                        >
                          {exp.category}
                        </Badge>
                      </div>
                      {exp.paidBy._id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteExpense(exp._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-3">
          <h3 className="text-lg font-semibold">Who owes whom</h3>
          {settlements.transactions.length === 0 ? (
            <Card className="py-8 text-center">
              <CardContent>
                <TrendingUp className="mx-auto mb-2 h-10 w-10 text-green-500" />
                <p className="text-muted-foreground">All settled up! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            settlements.transactions.map((t, i) => {
              const fromMember = group.members.find(
                (m) => m.user._id === t.from,
              );
              const toMember = group.members.find((m) => m.user._id === t.to);
              const isCurrentUser = t.from === currentUserId;
              return (
                <Card
                  key={i}
                  className={isCurrentUser ? "border-red-200 bg-red-50" : ""}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-red-100 text-sm text-red-700">
                            {fromMember?.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-green-100 text-sm text-green-700">
                            {toMember?.user?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-2">
                          <p className="text-sm font-medium">
                            {fromMember?.user?.name || t.from} owes{" "}
                            {toMember?.user?.name || t.to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600">
                          ₹{t.amount}
                        </span>
                        {isCurrentUser && (
                          <Button
                            size="sm"
                            onClick={() => handleSettle(t.to, t.amount)}
                          >
                            Settle
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {group.members.map((m) => (
              <Card key={m.user._id}>
                <CardContent className="flex items-center gap-3 pt-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {m.user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.user.email}
                    </p>
                  </div>
                  {m.user._id === group.createdBy._id && (
                    <Badge className="ml-auto" variant="secondary">
                      Admin
                    </Badge>
                  )}
                  {isCreator && m.user._id !== group.createdBy._id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemoveMember(m.user._id)}
                      disabled={removingMemberId === m.user._id}
                    >
                      {removingMemberId === m.user._id
                        ? "Removing..."
                        : "Remove"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="max-h-[65vh] space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-2 md:p-3">
                {chatLoading ? (
                  <LoadingSpinner label="Loading chat" />
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No messages yet. Start the group chat.
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender?._id === currentUserId;
                    const canDelete = mine || isCreator;
                    const seenByOthersCount = (message.seenBy || []).filter(
                      (id) => String(id) !== String(currentUserId),
                    ).length;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[92%] rounded-xl px-3 py-2 md:max-w-[80%] ${
                            mine
                              ? "bg-primary text-primary-foreground"
                              : "bg-white ring-1 ring-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold">
                              {mine ? "You" : message.sender?.name || "Member"}
                            </p>
                            {canDelete ? (
                              <button
                                type="button"
                                className="opacity-70 transition-opacity hover:opacity-100"
                                onClick={() => handleDeleteMessage(message._id)}
                                disabled={deletingMessageId === message._id}
                                title="Delete message"
                              >
                                {deletingMessageId === message._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : null}
                          </div>
                          <p className="text-sm">{message.text}</p>
                          <div className="mt-1 flex items-center justify-end gap-2 text-[11px] opacity-80">
                            {mine && seenByOthersCount > 0 ? (
                              <span>Seen by {seenByOthersCount}</span>
                            ) : null}
                            <span>
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  maxLength={500}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !chatText.trim()}
                  className="shrink-0"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
