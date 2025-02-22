import { Body, Controller, Get, Post, Param, Delete, Put, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersDto } from './users.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // Crear un nuevo usuario
    @Post()
    async crearUsuario(@Body() usersDto: UsersDto) {
        try {
            const userCreado = await this.usersService.createUser(usersDto);
            return { ok: true, message: 'Usuario creado exitosamente', user: userCreado };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    // Obtener todos los usuarios
    @Get()
    async obtenerUsuarios() {
        return await this.usersService.getUsers();
    }

    // Obtener un usuario por ID
    @Get(':id')
    async obtenerUsuarioPorId(@Param('id') id: string) {
        const user = await this.usersService.getUserById(id);
        if (!user) throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
        return user;
    }

    // Actualizar un usuario
    @Put(':id')
    async actualizarUsuario(@Param('id') id: string, @Body() usersDto: UsersDto) {
        return await this.usersService.updateUser(id, usersDto);
    }

    // Eliminar un usuario
    @Delete(':id')
    async eliminarUsuario(@Param('id') id: string) {
        return await this.usersService.deleteUser(id);
    }
}
