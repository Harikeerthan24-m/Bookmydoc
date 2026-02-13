import crypto from 'crypto';

const algorithm = 'aes-256-cbc';

// Generate secret hash with crypto to use for encryption
const key = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPTION_SECRET_KEY as string)
  .digest('hex')
  .substring(0, 32);

const encryptionIV = crypto
  .createHash('sha512')
  .update(process.env.ENCRYPTION_SECRET_KEY + '_vi')
  .digest('hex')
  .substring(0, 16);

// Encrypt data
export function encryptData(data: any) {
  const cipher = crypto.createCipheriv(algorithm, key, encryptionIV);
  return Buffer.from(
    cipher.update(data, 'utf8', 'hex') + cipher.final('hex'),
  ).toString('base64'); // Encrypts data and converts to hex and base64
}

// Decrypt data
export function decryptData(encryptedData: any) {
  const buff = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV);
  return (
    decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
    decipher.final('utf8')
  ); // Decrypts data and converts to utf8
}
