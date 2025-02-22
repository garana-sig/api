import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { IUsers } from './users.model';
import { UsersDto } from './users.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel('Users') private readonly usersModel: Model<IUsers>) {}

    // Crear usuario con password hasheado
    async createUser(usersDto: UsersDto): Promise<IUsers> {
        const hashedPassword = await bcrypt.hash(usersDto.password, 10);
        const newUser = new this.usersModel({ ...usersDto, password: hashedPassword });
        return await newUser.save();
    }

    // Obtener todos los usuarios
    async getUsers(): Promise<IUsers[]> {
        return await this.usersModel.find();
    }

    // Obtener un usuario por ID
    async getUserById(id: string): Promise<IUsers> {
        const user = await this.usersModel.findById(id);
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    // Actualizar usuario
    async updateUser(id: string, usersDto: UsersDto): Promise<IUsers|null> {
        return await this.usersModel.findByIdAndUpdate(id, usersDto, { new: true });
    }

    // Eliminar usuario
    async deleteUser(id: string): Promise<{ message: string }> {
        const result = await this.usersModel.findByIdAndDelete(id);
        if (!result) throw new NotFoundException('Usuario no encontrado');
        return { message: 'Usuario eliminado correctamente' };
    }

    async findByUsername(usuario: string): Promise<IUsers | null> {
        return this.usersModel.findOne({ usuario }).exec();
      }
}
