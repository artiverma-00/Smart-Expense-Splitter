"use client";

import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGroups } from "@/hooks/useGroups";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Receipt,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export default function GroupsPage() {
  const { groups, loading, createGroup, updateGroup, deleteGroup } =
    useGroups();

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

  if (loading) return <LoadingSpinner size="lg" label="Loading groups" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groups</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your expense groups
          </p>
        </div>
        <CreateGroupModal onCreate={createGroup} />
      </div>

      {groups.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent>
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No groups yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create a group to start splitting expenses
            </p>
            <CreateGroupModal onCreate={createGroup} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group._id}
              className="group flex h-full min-h-52 flex-col border-2 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
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
              <CardContent className="mt-auto space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {group.members.length} members
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Receipt className="h-4 w-4" />₹{group.totalExpenses}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((m) => (
                      <div
                        key={m.user._id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-medium text-white"
                      >
                        {m.user.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs text-gray-600">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                  <Link href={`/groups/${group._id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      Open <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
