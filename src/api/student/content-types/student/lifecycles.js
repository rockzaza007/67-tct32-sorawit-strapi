const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.SECRET_KEY); // Should be a 32-byte key for aes-256
const iv = process.env.SECRET_KEY_IV; // Should be a 16-byte IV for aes-256-cbc
const api = 'api::student.student';
const encrypt = async (data) => {return strapi.service(api).encryptPhoneNumber(data)}
const decrypt = async (data) => {return strapi.service(api).decryptPhoneNumber(data)}


module.exports = {
  async beforeCreate(event) {
    console.log('beforeCreate', event.params);
    const phoneNumber = event.params.data.PhoneNumber;
    event.params.data.PhoneNumber = await encrypt(phoneNumber);
  },
  async beforeUpdate(event) {
    console.log('beforeUpdate', event.params.data);
    const phoneNumber = event.params.data.PhoneNumber;
    // Check if a phone number exists
    if (phoneNumber) {
      event.params.data.PhoneNumber = await encrypt(phoneNumber);
    } 
  }, 
  async afterFindMany(event) {
    console.log('afterFindMany', event.result);
    event?.result?.map(async result => {
      if (result.PhoneNumber) {
        result.PhoneNumber = await decrypt(result.PhoneNumber);
      }
    })
  },
  async afterFindOne(event) {
    console.log('afterFindOne', event.result);
    if (event.result && event.result.PhoneNumber) {
      if (event.result.PhoneNumber) {
        event.result.PhoneNumber = await decrypt(event.result.PhoneNumber);
      }
    }
  },
};
