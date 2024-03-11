import bcrypt from 'bcrypt';

const SALT_ROUNDS = 13;

export const hash = async (
  str: string,
  rounds = SALT_ROUNDS,
): Promise<string> => {
  const salt = await bcrypt.genSalt(rounds);
  return await bcrypt.hash(str, salt);
};

export const compare = async (str: string, hash = ''): Promise<boolean> => {
  return bcrypt.compare(str, hash);
};
