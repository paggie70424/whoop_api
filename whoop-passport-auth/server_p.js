import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

dotenv.config();

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Serialize/Deserialize
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// OAuth2 Strategy for Whoop
passport.use('whoop', new OAuth2Strategy({
  authorizationURL: 'https://api.whoop.com/oauth/oauth2/auth',
  tokenURL:'https://api.prod.whoop.com/oauth/oauth2/token',
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
}, function(accessToken, refreshToken, profile, cb) {
  const user = { accessToken, refreshToken };
  return cb(null, user);
}));


// // Add this to log more details:
// OAuth2Strategy.prototype.userProfile = function (accessToken, done) {
//   done(null, {}); // skip profile fetch
// };


import { URLSearchParams } from 'url';

OAuth2Strategy.prototype.getOAuthAccessToken = function(code, params, callback) {
  const post_data = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: this._callbackURL,
    client_id: this._clientId,
    client_secret: this._clientSecret
  });

  const post_headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  this._oauth2._request(
    'POST',
    this._oauth2._getAccessTokenUrl(),
    post_headers,
    post_data.toString(),
    null,
    function(error, data, response) {
      if (error) {
        callback(error);
      } else {
        let results;
        try {
          results = JSON.parse(data);
        } catch (e) {
          results = require('querystring').parse(data);
        }
        const access_token = results.access_token;
        const refresh_token = results.refresh_token;
        callback(null, access_token, refresh_token, results);
      }
    }
  );
};


// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Step 1: Redirect to WHOOP Auth
app.get('/auth/whoop', passport.authenticate('whoop'));

// // Step 2: WHOOP callback
// app.get('/auth/whoop/callback',
//   passport.authenticate('whoop', { failureRedirect: '/login' }),
//   (req, res) => {
//     console.log("✅ Access token:", req.user.accessToken);
//     req.session.accessToken = req.user.accessToken; // Save accessToken in session
//     res.redirect('/dashboard');
//   }
// );

app.get('/auth/whoop/callback',
  passport.authenticate('whoop', { failureRedirect: '/login' }),
  (req, res) => {
    console.log("✅ Access token:", req.user.accessToken);
    req.session.accessToken = req.user.accessToken; // Store access token in session
    res.redirect('/whoop/home'); // Redirect to profile route
  }
);


// ADD THIS to log real token error
app.use((err, req, res, next) => {
  console.error("💥 OAuth Error Details:", err);
  res.status(500).send('OAuth failed: ' + err.message);
});


import axios from 'axios'; //  Add this at the top of your file if not already there

app.get('/whoop/profile', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); //  Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


app.get('/whoop/recovery', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/recovery', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); // Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/whoop/sleep', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/activity/sleep', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); // Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


app.get('/whoop/workout', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/activity/workout', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); //  Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


app.get('/whoop/cycles', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/cycle', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); // Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});


app.get('/whoop/body', async (req, res) => {
  const accessToken = req.session.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await axios.get('https://api.prod.whoop.com/developer/v1/user/measurement/body', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("👤 WHOOP Profile Data:", response.data); // Log profile data
    res.json(response.data); // Send JSON to client
  } catch (err) {
    console.error('❌ Error fetching WHOOP profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/whoop/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Fallback routes
app.get('/login', (req, res) => {
  res.send('<h2>Login failed. Please try again.</h2><a href="/">Back to Home</a>');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


app.get('/dashboard', (req, res) => {
  if (!req.session || !req.session.accessToken) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
