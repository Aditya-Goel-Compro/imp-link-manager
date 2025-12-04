// models/reminder.model.js
import mongoose, { Schema } from "mongoose";

const reminderSchema = new Schema(
  {
    // The workspace type: "office" or "personal"
    type: {
      type: String,
      enum: ["office", "personal"],
      required: true,
    },

    // The actual task text
    task: {
      type: String,
      required: true,
      trim: true,
    },

    // Time of day in "HH:MM" 24h format (IST assumed on frontend)
    timeOfDay: {
      type: String,
      required: true,
      trim: true,
      // simple format validation
      validate: {
        validator: function (v) {
          return /^\d{2}:\d{2}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid timeOfDay. Expected HH:MM (e.g. 09:30)`,
      },
    },

    // Whether this reminder is active
    isActive: {
      type: Boolean,
      default: true,
    },

    // The last date (any time) when user marked it "done"
    lastDoneDate: {
      type: Date,
      default: null,
    },

    repeat: {
      type: String,
      enum: ["daily", "weekday", "weekend"],
      default: "daily",
    },
  },
  {
    timestamps: true,
  }
);

// Optional: virtual for formatted time or lastDone, if you want later

export const Reminder = mongoose.model("Reminder", reminderSchema);
