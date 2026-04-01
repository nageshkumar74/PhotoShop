import mongoose, { Schema, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  password: string;
  role: "user" | "admin";
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,   // ✅ added
      trim: true         // ✅ added
    },
    password: { 
      type: String, 
      required: true,
      select: false      // ✅ added (important for security)
    },
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },
  },
  { timestamps: true }
);

// ✅ FIXED middleware (important)
userSchema.pre("save", async function () {
  const user = this as any;

  if (!user.isModified("password")) {
    return;
  }

  // ✅ trim before hashing (fixes your earlier issue)
  user.password = await bcrypt.hash(user.password.trim(), 10);

  
});

// ✅ OPTIONAL but recommended (clean password compare)
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return bcrypt.compare(enteredPassword.trim(), this.password);
};

const User = models.User || mongoose.model<IUser>("User", userSchema);

export default User;