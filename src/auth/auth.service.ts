import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async validateUser(usuario: string, password: string) {
        const user = await this.usersService.findByUsername(usuario);
        if (!user) throw new UnauthorizedException('Credenciales incorrectas');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Credenciales incorrectas');

        return user;
    }

    async login(usuario: string, password: string) {
        const user = await this.validateUser(usuario, password);
        const payload = { sub: user.id, usuario: user.usuario, role: user.role };

        return {
            access_token: this.jwtService.sign(payload),
            
        };
    }
}
