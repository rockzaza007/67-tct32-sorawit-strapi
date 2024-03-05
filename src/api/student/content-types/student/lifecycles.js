const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.SECRET_KEY); // Should be a 32-byte key for aes-256
const iv = process.env.SECRET_KEY_IV; // Should be a 16-byte IV for aes-256-cbc

const encryptPhoneNumber = (phoneNumber) => {
  let encryptedPhoneNumber = '';
  // Split the phone number into pairs of two characters
  for (let i = 0; i < phoneNumber.length; i += 2) {
    const chunk = phoneNumber.slice(i, i + 2);
    // Encrypt each chunk and append to the result
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encryptedChunk = cipher.update(chunk, 'utf8', 'hex');
    encryptedChunk += cipher.final('hex');
    encryptedPhoneNumber += encryptedChunk;
  }
  return encryptedPhoneNumber;
};

const decryptPhoneNumber = (encryptedPhoneNumber) => {
  let decryptedPhoneNumber = '';
  // Split the encrypted phone number into pairs of encrypted chunks
  for (let i = 0; i < encryptedPhoneNumber.length; i += 32) { // Assuming each chunk is 32 characters long
    const encryptedChunk = encryptedPhoneNumber.slice(i, i + 32); // Assuming each chunk is 32 characters long
    // Decrypt each chunk and append to the result
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decryptedChunk = decipher.update(encryptedChunk, 'hex', 'utf8');
    decryptedChunk += decipher.final('utf8');
    decryptedPhoneNumber += decryptedChunk;
  }
  return decryptedPhoneNumber;
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
