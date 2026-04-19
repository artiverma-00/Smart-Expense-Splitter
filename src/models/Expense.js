import mongoose from "mongoose";

const SplitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
});

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "food",
        "travel",
        "rent",
        "entertainment",
        "utilities",
        "shopping",
        "health",
        "other",
      ],
      default: "other",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },
    splits: [SplitSchema],
    date: { type: Date, default: Date.now },
    aiCategorized: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
