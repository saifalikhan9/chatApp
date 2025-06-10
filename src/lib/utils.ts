import bcrypt from "bcrypt";

export const hashPasswordFn = async (password: string) => {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
};
export const decryptPassword = async (
  password: string,
  hashedPassword: string
) => {
  const res = await bcrypt.compare(password, hashedPassword);
  return res;
};
