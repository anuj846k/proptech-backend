import argon2 from 'argon2';

export const hashPassword = async (password: string) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 5,
    parallelism: 1,
  });
};

export const VerifyPassword = async (
  hashedPassword: string,
  password: string,
) => {
  return argon2.verify(hashedPassword, password);
};
