const crypto = require('crypto');
console.log('NATIONAL_ID_HMAC_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('PASSWORD_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('\nSave these values securely. Use the SAME values for data import and server deployment.');
console.log('Do not commit them to GitHub or send them in chat.');
