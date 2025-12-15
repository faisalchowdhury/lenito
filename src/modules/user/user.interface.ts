import { Document, Types } from "mongoose";
import { TRole } from "../../config/role";

// export interface ILocation {
//   type: "Point";
//   coordinates: [number, number]; // [longitude, latitude]
// }

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  role: string;
  password: string;
  isVerified: boolean;
  isDeleted: boolean;
}
export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
