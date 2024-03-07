import type { NextFunction, Request, Response } from 'express';

import { sendOTP } from '../helpers/mail-helper';
import {
  addUser,
  findOneUser,
  ifUserExists,
  updateUserById,
  validatePassword,
} from '../services/user-service';
import {
  AlreadyTakenError,
  ApiError,
  NotFoundError,
  ValidationError,
} from '../utils/api-error';
import { omit } from '../utils/common';
import { sign } from '../utils/jwt';
import { generateOTP, verifyOTP } from '../utils/otp';

const omitData = ['password'];

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.body.user;
    const exists = await ifUserExists({
      email: user.email,
      mobile: user.mobile,
    });
    if (exists) {
      throw new AlreadyTakenError('user email', JSON.stringify(user));
    }
    const newUser = await addUser(user);
    const userData = omit(newUser?.toJSON(), omitData);
    const accessToken = sign({ ...userData });

    userData['token'] = accessToken;

    res.status(201).json({
      // data: userData,
      user: userData,
      error: false,
      msg: 'User registered successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const _user = req.body.user;
    const { email, password } = _user;

    const user = await findOneUser({ email });
    if (!user) {
      throw new NotFoundError(email, 'user email/id is Not Found');
    }

    const isPasswordValid = await validatePassword(user.email, password);
    if (!isPasswordValid) {
      throw new ValidationError('Password is Incorrect');
    }
    const userData = omit(user?.toJSON(), omitData);
    const accessToken = sign({ ...userData });
    // userData.dataValues['token'] = accessToken;
    userData['token'] = accessToken;

    res.status(200).json({
      // data: userData,
      user: userData,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    let user = await findOneUser({ email });
    if (!user) {
      throw new ApiError(400, 'Email id is incorrect');
    }
    user = user?.toJSON();
    // generate otp
    const otp = generateOTP(user.email);

    const send = await sendOTP(user.email, otp);
    // send otp to email
    if (!send) {
      throw new ApiError(400, 'Failed to send OTP');
    }

    return res.status(200).json({
      msg: 'Email sent sucessfully',
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp, password } = req.body;

    let user = await findOneUser({ email });
    if (!user) {
      throw new ApiError(400, 'Email id is incorrect');
    }
    user = user?.toJSON();
    const isValid = verifyOTP(user.email, otp);

    if (!isValid) {
      return res.status(400).send({
        error: true,
        errorMsg: 'OTP is Incorrect',
      });
    }

    const updated = await updateUserById({ password }, user.id);

    return res.status(200).json({
      updated: updated[0],
      msg: updated[0] ? 'Password reseted successfully' : 'Failed to reset',
      error: false,
    });
  } catch (err) {
    next(err);
  }
};
