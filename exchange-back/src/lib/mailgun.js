import Mailgun from 'mailgun-js';

export const apiKey = 'key-022c9625b83bdb3d741c06fd3b5f9141';
export const domain = 'mg.random.zone';
export const from   = 'Profit.Best <noreply@profit.best>';
const mailgun = new Mailgun({apiKey, domain});
export default mailgun;
