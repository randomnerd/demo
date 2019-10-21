import authenticator from 'otplib/authenticator';
import { encrypt, compare } from '../lib/password';
import { User, Currency, Notification, Address } from '../models';

export async function signup({email, username, password, realname}, respond) {
  try {
    let encrypted = await encrypt(password);
    // first registered user becomes an admin for convenience
    let role = await User.count() === 0 ? 'admin' : 'user';
    let user = await User.create({email, username, realname, password: encrypted, role});
    if (process.env.NODE_ENV === 'production' && process.env.ENV === 'prod') return respond(null, user);
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export function logout(params, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    this.deauthenticate();
    respond(null, true);
  } catch (error) {
    respond(error);
  }
}

export async function login({email, username, password, otpToken}, respond) {
  try {
    let fields = { email, username };
    if (!email) delete fields.email;
    if (!username) delete fields.username;
    let user = await User.findOne({ where: { $or: fields }});
    if (!user) throw new Error(18);
    if (!await compare(password, user.password)) throw new Error(4);
    if (user.otpEnabled) {
      if (!otpToken) throw new Error(13);
      if (!authenticator.check(otpToken, user.otpSecret)) throw new Error(9);
    }
    if (user.emailCode && process.env.NODE_ENV === 'production' && process.env.ENV === 'prod') throw new Error(1);
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function verifyEmail({email, code}, respond) {
  try {
    let user = await User.findOne({ where: { email } });
    if (!user) throw new Error(18);
    if (!user.emailCode) throw new Error(19);
    if (user.emailCode !== code) throw new Error(5);
    await user.update({emailCode: null});
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function resendVerifyEmail({ email }, respond) {
  try {
    let user = await User.findOne({ where: { email } });
    if (!user) throw new Error(18);
    if (!user.emailCode) throw new Error(19);
    user.sendActivationEmail();
    respond(null, true);
  } catch (error) {
    respond(error);
  }
}

export async function forgotPassword({ email }, respond) {
  try {
    let user = await User.findOne({ where: { email } });
    if (!user) throw new Error(18);
    await user.forgotPassword();
    respond(null, true);
  } catch (error) {
    respond(error);
  }
}

export async function resetPassword({ passwordCode, newPassword, otpToken }, respond) {
  try {
    let user = await User.findOne({ where: { passwordCode } });
    if (!user) throw new Error(7);
    if (user.otpEnabled && !authenticator.check(otpToken, user.otpSecret)) throw new Error(9);
    let password = await encrypt(newPassword);
    await user.update({ password, passwordCode: null });
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}


export async function updateProfile({email, username, realname}, respond)  {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    await user.update({email, username, realname});
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function changePassword({oldPassword, newPassword}, respond)  {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    if (!await compare(oldPassword, user.password)) throw new Error(4);
    let password = await encrypt(newPassword);
    await user.update({password});
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function getOtpSecret(params, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    if (user.otpEnabled) throw new Error(8);
    respond(null, user.otpSecret);
  } catch (error) {
    respond(error);
  }
}

export async function enableOtp({password, token}, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    if (user.otpEnabled) throw new Error(8);
    if (!await compare(password, user.password)) throw new Error(4);
    if (!authenticator.check(token, user.otpSecret)) throw new Error(9);
    await user.update({ otpEnabled: true });
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function disableOtp({password, token}, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    if (!user.otpEnabled) throw new Error(12);
    if (!await compare(password, user.password)) throw new Error(4);
    if (!authenticator.check(token, user.otpSecret)) throw new Error(9);
    await user.update({ otpEnabled: false });
    this.setAuthToken(newToken(user));
    respond(null, user);
  } catch (error) {
    respond(error);
  }
}

export async function withdraw({currencyId, amount, destination, token}, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let user = await User.findById(this.authToken.id);
    if (user.otpEnabled && !authenticator.check(token, user.otpSecret)) throw new Error(9);
    let currency = await Currency.findById(currencyId);
    let client = currency.cryptoClient();
    let hash = await client.withdraw(user.id, amount, destination);
    respond(null, hash);
  } catch (error) {
    respond(error);
  }
}

export async function removeNotification({id}, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let note = await Notification.findById(id);
    await note.update({ack: true});
    respond(null, note);
  } catch (error) {
    respond(error);
  }
}

export async function generateAddress({ currencyId }, respond) {
  try {
    if (!this.authToken) throw new Error(2);
    let address = await Address.create({ userId: this.authToken.id, currencyId })
    respond(null, address);
  } catch (error) {
    respond(error);
  }
}

function newToken({id, email, username, realname, role, otpEnabled, banned, chatBanned}) {
  return { id, email, username, realname, role, otpEnabled, banned, chatBanned };
}
