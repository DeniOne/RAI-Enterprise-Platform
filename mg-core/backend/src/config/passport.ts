import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../services/auth.service';
import dotenv from 'dotenv';

dotenv.config();

const authService = new AuthService();

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
};

export const jwtStrategy = new JwtStrategy(options, async (payload, done) => {
    try {
        const user = await authService.validateUser(payload);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
});
