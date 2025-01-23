import jwt from 'jsonwebtoken';

export const generateTestToken = (userId: string) => {
    if (!process.env.TOKEN_SECRET) {
        process.env.TOKEN_SECRET = 'test-secret';
    }
    return jwt.sign({ _id: userId }, process.env.TOKEN_SECRET);
}; 