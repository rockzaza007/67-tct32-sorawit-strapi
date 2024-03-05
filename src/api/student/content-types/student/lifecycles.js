const crypto = require('crypto');
const md5 = require('md5');

const algorithm = 'aes-256-cbc';
console.log('process.env.SECRET_KEY', process.env.SECRET_KEY);
const key = Buffer.from(process.env.SECRET_KEY); // Should be a 32-byte key for aes-256
const iv = process.env.SECRET_KEY_IV; // Should be a 16-byte IV for aes-256-cbc


const encryptPhoneNumber = (phoneNumber) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedPhoneNumber = cipher.update(phoneNumber, 'utf8', 'hex');
  encryptedPhoneNumber += cipher.final('hex');
 // Pad the encrypted phone number to ensure it's at least 128 characters long
  encryptedPhoneNumber = padToLength(encryptedPhoneNumber, 128);

  return encryptedPhoneNumber;
};

const decryptPhoneNumber = (encryptedPhoneNumber) => {
  encryptedPhoneNumber = removePadding(encryptedPhoneNumber);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let phoneNumber = decipher.update(encryptedPhoneNumber, 'hex', 'utf8');
  phoneNumber += decipher.final('utf8');

  return phoneNumber;
};

// Custom padding function to ensure fixed length
const padToLength = (string, length) => {
  if (string.length >= length) return string; // No need to pad
  const paddingLength = length - string.length;
  const padding = crypto.randomBytes(paddingLength).toString('hex');
  return string+padding;
};

// Custom function to remove padding
const removePadding = (string) => {
  const paddingLength = 32; // Number of characters to remove
  if (string.length > paddingLength) {
    return string.slice(0, paddingLength); // Remove trailing characters
  } else {
    return string; // No padding to remove
  }
};


module.exports = {
  async beforeCreate(event) {
    console.log('beforeCreate', event.params);
    event.params.data.PhoneNumber = encryptPhoneNumber(event.params.data.PhoneNumber);
  },
  async beforeUpdate(event) {
    console.log('beforeUpdate', event.params.data);
    event.params.data.PhoneNumber = encryptPhoneNumber(event.params.data.PhoneNumber);
  },
  async afterFindMany(event) {
    console.log('afterFindMany', event.result);
    event.result.forEach(item => {
      if (item.PhoneNumber) {
        item.PhoneNumber = decryptPhoneNumber(item.PhoneNumber);
        console.log('afterFindMany :', item.PhoneNumber);
      }
    });
  },
  async afterFindOne(event) {
    console.log('afterFindOne', event.result);
    if (event.result && event.result.PhoneNumber) {
      event.result.PhoneNumber = decryptPhoneNumber(event.result.PhoneNumber);
      console.log('afterFindOne :', event.result.PhoneNumber);
    }
  },
};
