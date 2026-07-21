import { Document } from "mongoose";

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
  image?: string;
  healthDetails?: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  provider: string;
  googleId: string;
}
export type IOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
} & Document;
