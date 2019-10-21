import bcrypt from 'bcrypt';

export function encrypt(password) {
  const saltRounds = 10;
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, (error, hash) => {
      if (error) return reject(error);
      resolve(hash);
    });
  });
}

export function compare(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}
