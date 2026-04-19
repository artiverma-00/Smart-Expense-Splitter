import mongoose from "mongoose";

const SettlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    settledAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.Settlement ||
  mongoose.model("Settlement", SettlementSchema);
