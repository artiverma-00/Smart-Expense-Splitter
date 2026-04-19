"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";
import {
  Users,
  Receipt,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { groups, loading, updateGroup, deleteGroup } = useGroups();
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);

  const handleEditGroup = async (group) => {
    const nextName = window.prompt("Enter group name", group.name);
    if (nextName === null) return;

    const trimmedName = nextName.trim();
    if (!trimmedName) {
      toast.error("Group name is required");
      return;
    }

    const nextDescription = window.prompt(
      "Enter group description (optional)",
      group.description || "",
    );
    if (nextDescription === null) return;

    try {
      await updateGroup(group._id, {
        name: trimmedName,
        description: nextDescription,
      });
      toast.success("Group updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update group");
    }
  };

  const handleDeleteGroup = async (group) => {
    const confirmed = window.confirm(
      `Delete ${group.name}? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteGroup(group._id);
      toast.success("Group deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete group");
    }
  };

  useEffect(() => {
    const currentUserId = user?.id || user?._id;
    if (!groups.length || !currentUserId) return;

    const fetchBalances = async () => {
      let owed = 0;
      let owe = 0;

      for (const g of groups) {
        try {
          const res = await axios.get(`/api/settlements?groupId=${g._id}`);
          const bal = res.data.balances[currentUserId] || 0;
          if (bal > 0) owed += bal;
          else if (bal < 0) owe += Math.abs(bal);
        } catch {
          // Skip one group failure and continue aggregating others.
        }
      }

      setTotalOwed(Math.round(owed * 100) / 100);
      setTotalOwe(Math.round(owe * 100) / 100);
    };

    const timer = setTimeout(() => {
      fetchBalances();
    }, 0);

    return () => clearTimeout(timer);
  }, [groups, user]);

  if (loading)
    return <LoadingSpinner size="lg" label="Loading your dashboard" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your expense summary
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> Total Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{groups.length}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> You are owed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">₹{totalOwed}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" /> You owe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">₹{totalOwe}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Groups</h2>
          <Link href="/groups">
            <Button variant="outline" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {groups.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">No groups yet</p>
              <Link href="/groups">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Create your first group
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.slice(0, 6).map((group) => (
              <Card
                key={group._id}
                className="flex h-full min-h-44 flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1 text-lg">
                      {group.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            handleEditGroup(group);
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDeleteGroup(group);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="min-h-10 text-sm text-muted-foreground">
                    {group.description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">
                      {group.members.length} members
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      ₹{group.totalExpenses}
                    </span>
                  </div>
                  <Link href={`/groups/${group._id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full gap-1"
                    >
                      Open Group <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
