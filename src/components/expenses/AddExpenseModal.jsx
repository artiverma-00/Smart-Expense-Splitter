"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusCircle, Loader2, Sparkles } from "lucide-react";

const CATEGORIES = [
  "food",
  "travel",
  "rent",
  "entertainment",
  "utilities",
  "shopping",
  "health",
  "other",
];

export default function AddExpenseModal({ groupId, members, onAdd }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    splitType: "equal",
    category: "other",
  });
  const [customSplits, setCustomSplits] = useState([]);

  const memberCount = members?.length || 0;
  const amountValue = Number(form.amount || 0);

  const buildEqualSplits = (amount) => {
    if (!members?.length || !amount || amount <= 0) {
      return (members || []).map((m) => ({ user: m.user._id, amount: 0 }));
    }

    const perPerson = Math.round((amount / members.length) * 100) / 100;
    const splits = members.map((m) => ({
      user: m.user._id,
      amount: perPerson,
    }));
    const total =
      Math.round(splits.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
    const diff = Math.round((amount - total) * 100) / 100;
    if (splits.length > 0 && diff !== 0) {
      splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    }
    return splits;
  };

  useEffect(() => {
    if (!open) return;
    setCustomSplits(buildEqualSplits(amountValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, members]);

  useEffect(() => {
    if (form.splitType !== "custom") return;
    setCustomSplits((prev) => {
      if (!prev.length) return buildEqualSplits(amountValue);
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.splitType]);

  const autoCategory = async () => {
    if (!form.title) return;
    setAiLoading(true);
    try {
      const res = await axios.post("/api/ai/categorize", {
        title: form.title,
        description: form.description,
      });
      setForm((f) => ({ ...f, category: res.data.category }));
      if (res.data.source === "fallback") {
        toast.info(
          "AI is not configured, using the best matching category instead.",
        );
      } else {
        toast.success(`AI detected: ${res.data.category}`);
      }
    } catch {
      toast.error("AI categorization failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(form.amount);

    if (form.splitType === "custom") {
      const totalCustom =
        Math.round(
          customSplits.reduce(
            (sum, split) => sum + Number(split.amount || 0),
            0,
          ) * 100,
        ) / 100;

      if (Math.abs(totalCustom - parsedAmount) > 0.01) {
        toast.error(`Custom split total must equal ₹${parsedAmount}`);
        return;
      }
    }

    setLoading(true);
    try {
      await onAdd({
        ...form,
        amount: parsedAmount,
        splits:
          form.splitType === "custom"
            ? customSplits.map((split) => ({
                user: split.user,
                amount: Number(split.amount || 0),
                paid: false,
              }))
            : undefined,
      });
      toast.success("Expense added!");
      setOpen(false);
      setForm({
        title: "",
        description: "",
        amount: "",
        splitType: "equal",
        category: "other",
      });
      setCustomSplits([]);
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };
  const perPersonAmount =
    memberCount > 0 ? Math.round((amountValue / memberCount) * 100) / 100 : 0;
  const customTotal = useMemo(
    () =>
      Math.round(
        customSplits.reduce(
          (sum, split) => sum + Number(split.amount || 0),
          0,
        ) * 100,
      ) / 100,
    [customSplits],
  );

  const handleSplitAmountChange = (userId, value) => {
    const parsed = value === "" ? "" : Math.max(0, Number(value));
    setCustomSplits((prev) =>
      prev.map((split) =>
        split.user === userId
          ? { ...split, amount: parsed === "" ? "" : parsed }
          : split,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Dinner at restaurant"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={autoCategory}
                disabled={aiLoading || !form.title}
                title="Auto-categorize with AI"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={form.category === cat ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setForm({ ...form, category: cat })}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split Type</Label>
            <div className="flex gap-3">
              {["equal", "custom"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={form.splitType === type ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setForm({ ...form, splitType: type })}
                >
                  {type}
                </Button>
              ))}
            </div>
            {form.splitType === "equal" &&
            amountValue > 0 &&
            memberCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Instant split: ₹{perPersonAmount} per person ({memberCount}{" "}
                people)
              </p>
            ) : null}

            {form.splitType === "custom" ? (
              <div className="space-y-2 rounded-md border p-3">
                {(members || []).map((member) => {
                  const current = customSplits.find(
                    (split) => split.user === member.user._id,
                  );
                  return (
                    <div
                      key={member.user._id}
                      className="flex items-center gap-2"
                    >
                      <p className="w-28 truncate text-sm">
                        {member.user.name}
                      </p>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={current?.amount ?? ""}
                        onChange={(e) =>
                          handleSplitAmountChange(
                            member.user._id,
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Custom total: ₹{customTotal} / ₹{amountValue || 0}
                </p>
              </div>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add Expense
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
