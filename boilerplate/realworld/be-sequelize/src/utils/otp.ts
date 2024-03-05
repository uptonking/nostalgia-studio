import { authenticator } from 'otplib';

import { otpConfig } from '../config/config';

const expireOTPInSeconds = 60 * parseInt(otpConfig.otpExpiry, 10);
authenticator.options = {
  step: expireOTPInSeconds,
  digits: 6,
};

export const generateOTP = (username: string) => {
  const secret = username + otpConfig.otpSecret;
  return authenticator.generate(secret);
};

export const verifyOTP = (username: string, otp: string) => {
  const secret = username + otpConfig.otpSecret;
  return authenticator.verify({ secret, token: otp });
};
