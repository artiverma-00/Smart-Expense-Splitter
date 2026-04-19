import ExpenseList from "@/components/expenses/ExpenseList";

export default async function GroupExpensesPage({ params }) {
  const resolvedParams = await params;
  return <ExpenseList groupId={resolvedParams.groupId} />;
}
