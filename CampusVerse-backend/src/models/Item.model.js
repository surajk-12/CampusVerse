import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: {
      type: [String],
      required: [true, "At least one item image is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["New", "Like New", "Good", "Fair"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["Available", "Sold"],
      default: "Available",
    },
    campusLocation: {
      type: String,
      required: [true, "Campus location is required"],
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Search Index
itemSchema.index({
  title: "text",
  description: "text",
  category: "text",
  campusLocation: "text",
});

const Item = mongoose.model("Item", itemSchema);
export default Item;
