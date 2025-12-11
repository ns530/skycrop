'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');

// Strategy registration
function configurePassport() {
  const {
    GOOGLECLIENTID,
    GOOGLECLIENTSECRET,
    OAUTHCALLBACK = '/api/v1/auth/google/callback',
  } = process.env;

  if (!GOOGLECLIENTID || !GOOGLECLIENTSECRET) {
    // eslint-disable-next-line no-console
    console.warn(
      '[passport] GOOGLECLIENTID/SECRET not set; Google OAuth endpoints will not function.'
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLECLIENTID || 'unset',
        clientSecret: GOOGLECLIENTSECRET || 'unset',
        callbackURL: OAUTHCALLBACK,
      },
      // Verify callback
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            Array.isArray(profile.emails) && profile.emails.length ? profile.emails[0].value : null;

          if (!email) {
            return done(null, false, { message: 'Google profile has no email' });
          }

          // Try find existing user
          let user = await User.scope('allStatuses').findOne({ where: { email } });

          // Create if missing
          if (!user) {
            user = await User.create({
              email,
              name: profile.displayName || email.split('@')[0],
              authprovider: 'google',
              emailverified: true,
              profilephotourl:
                Array.isArray(profile.photos) && profile.photos.length
                  ? profile.photos[0].value
                  : null,
              role: 'farmer',
              status: 'active',
            });
          } else if (user.status !== 'active') {
            // If user exists but is not active, reject
            return done(null, false, { message: 'Account is not active' });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // Not using sessions; serialize/deserialize are no-ops for completeness.
  passport.serializeUser((user, done) => done(null, user.user_id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.scope('allStatuses').findOne({ where: { user_id: id } });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  });

  return passport;
}

module.exports = configurePassport();
