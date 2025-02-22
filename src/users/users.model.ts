import mongoose from 'mongoose';
import { UserRole } from './users.dto';

export const UsersSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cedula: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  usuario: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
});

export interface IUsers extends mongoose.Document {
  nombre: string;
  cedula: string;
  telefono: string;
  correo: string;
  usuario: string;
  password: string;
  role: UserRole;
}
