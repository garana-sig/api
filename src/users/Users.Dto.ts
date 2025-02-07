import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    CONTA = 'conta',
    SST = 'sst',
    PRODUCCION = 'produccion',
    COMPRAS = 'compras',
    VENTAS = 'ventas',
}

export class UsersDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @Matches(/^\d{6,10}$/, { message: 'La cédula debe contener entre 6 y 10 dígitos numéricos' })
    cedula: string;

    @IsString()
    @Matches(/^\d{7,10}$/, { message: 'El teléfono debe contener entre 7 y 10 dígitos numéricos' })
    telefono: string;

    @IsEmail({}, { message: 'Correo inválido' })
    correo: string;

    @IsString()
    @MinLength(4, { message: 'El usuario debe tener al menos 4 caracteres' })
    usuario: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsEnum(UserRole, { message: 'Rol inválido' })
    role: UserRole;
}
