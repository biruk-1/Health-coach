require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');
const flash = require('connect-flash');
const { supabase } = require('../lib/supabase-node');
const moment = require('moment');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Admin credentials - in a real app, these would be stored securely
// For demo purposes, we'll hardcode them here
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Hash the admin password
const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// Configure passport
passport.use(new LocalStrategy(
  (username, password, done) => {
    if (username === ADMIN_USERNAME) {
      if (bcrypt.compareSync(password, hashedPassword)) {
        return done(null, { username: ADMIN_USERNAME });
      }
      return done(null, false, { message: 'Incorrect password' });
    }
    return done(null, false, { message: 'Incorrect username' });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser((username, done) => {
  if (username === ADMIN_USERNAME) {
    done(null, { username: ADMIN_USERNAME });
  } else {
    done(new Error('User not found'));
  }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'psychic-directory-admin-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Routes
app.get('/login', (req, res) => {
  res.render('login', { 
    error: req.flash('error'),
    message: req.flash('message')
  });
});

app.post('/login', 
  passport.authenticate('local', { 
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('message', 'You have been logged out successfully');
    res.redirect('/login');
  });
});

// Dashboard route
app.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.render('dashboard', { 
        users: [],
        error: 'Failed to fetch users',
        moment
      });
    }

    res.render('dashboard', { 
      users,
      error: null,
      moment
    });
  } catch (err) {
    console.error('Server error:', err);
    res.render('dashboard', { 
      users: [],
      error: 'Server error occurred',
      moment
    });
  }
});

// User details route
app.get('/users/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user details from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    // If user is a psychic, get psychic details
    let psychicDetails = null;
    if (user.role === 'psychic') {
      const { data: psychic, error: psychicError } = await supabase
        .from('psychics')
        .select('*')
        .eq('user_id', id)
        .single();

      if (!psychicError) {
        psychicDetails = psychic;
      }
    }

    // Get user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        psychic_id,
        psychics (
          id,
          specialties,
          rating,
          total_reviews,
          profile_image,
          users (
            full_name
          )
        )
      `)
      .eq('user_id', id);

    res.render('user-details', { 
      user,
      psychicDetails,
      favorites: favoritesError ? [] : favorites,
      error: null,
      moment
    });
  } catch (err) {
    console.error('Server error:', err);
    req.flash('error', 'Server error occurred');
    res.redirect('/');
  }
});

// Verify psychic route
app.post('/verify-psychic/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update psychic verification status
    const { error } = await supabase
      .from('psychics')
      .update({ is_verified: true })
      .eq('id', id);

    if (error) {
      console.error('Error verifying psychic:', error);
      req.flash('error', 'Failed to verify psychic');
    } else {
      req.flash('message', 'Psychic verified successfully');
    }
    
    res.redirect(`/users/${req.body.user_id}`);
  } catch (err) {
    console.error('Server error:', err);
    req.flash('error', 'Server error occurred');
    res.redirect('/');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Admin panel running at http://localhost:${PORT}`);
});