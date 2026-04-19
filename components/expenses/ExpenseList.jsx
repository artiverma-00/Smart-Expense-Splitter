export default function ExpenseList({ groupId }) {
  return <div>Expense list {groupId ? `for ${groupId}` : ""}</div>;
}
