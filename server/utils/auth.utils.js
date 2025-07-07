import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);
