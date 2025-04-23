const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();
const prisma = new PrismaClient();

const whoopOAuthConfig = {
  authorizationURL: `${process.env.WHOOP_API_HOSTNAME}/oauth/oauth2/auth`,
  tokenURL: `${process.env.WHOOP_API_HOSTNAME}/oauth/oauth2/token`,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  state: true,
  scope: [
    'offline',
    'read:profile',
    'read:recovery',
    'read:cycles',
    'read:workout',
    'read:sleep',
    'read:body_measurement',
  ].join(' ')
};

const fetchProfile = async (accessToken, done) => {
  try {
    const response = await fetch(
      `${process.env.WHOOP_API_HOSTNAME}/developer/v1/user/profile/basic`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const profile = await response.json();
    done(null, profile);
  } catch (error) {
    done(error);
  }
};

const getUser = async (accessToken, refreshToken, params, profile, done) => {
  const { user_id, first_name, last_name } = profile;
  const userData = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + params.expires_in * 1000,
    userId: user_id,
    firstName: first_name,
    lastName: last_name,
  };

  try {
    const user = await prisma.user.upsert({
      where: { userId: user_id },
      update: userData,
      create: userData,
    });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
};


const whoopAuthorizationStrategy = new OAuth2Strategy(whoopOAuthConfig, getUser)
whoopAuthorizationStrategy.userProfile = fetchProfile

passport.use('withWhoop', whoopAuthorizationStrategy)

import fetch from 'node-fetch'; // using dynamic import
import passport from 'passport';
import { Strategy as WhoopStrategy } from 'passport-whoop'; // Example, adjust as necessary

// Your passport strategy setup here
passport.use(new WhoopStrategy({
    clientID: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/example/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Here you handle user profile info
    return done(null, profile);
}));

// Serialize and deserialize user data
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
