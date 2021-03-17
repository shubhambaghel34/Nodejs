const CONSTANTS = require("../constants");
const express = require("express");
const passport = require('passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();

const User = require('../models/user');
const sampleData = require('../sampleData');
const register = require('../controllers/userController');

const { 
  SECRET_KEY : secret,
  COOKIE_AUTH : cookie_auth,
  TOKEN_AUTH : token_auth,
  TOKEN_EXPIRY : token_expiry
} = process.env;

router.post(CONSTANTS.ENDPOINT.REGISTER, register);

if (cookie_auth == 'true') {
  router.post(CONSTANTS.ENDPOINT.LOGIN, passport.authenticate('local'), (req, res) => {
    const userDetails = {
      _id : req.user._id,
      name : req.user.name,
      email : req.user.email
    }
    res.json({ status: 'success', user: userDetails });
  });

  router.get(CONSTANTS.ENDPOINT.GRID, isLoggedIn, (req, res) => {
    res.json(sampleData.textAssets);
  });
}

if (token_auth == 'true') {
  router.post(CONSTANTS.ENDPOINT.LOGIN, (req,res) => {
    const { email, password }  = req.body;
    User.findOne({ email })
         .then(user => {
            if (!user) {
               return res.status(401).json({error: 'Unknown User'});
            }
            User.comparePassword(password, user.password, function(err, isMatch){
              if (err) throw err;
              if (isMatch) {
                const userDetails = {
                  id: user._id,
                  name: user.name,
                  email: user.email
                };
                jwt.sign(userDetails, secret, { expiresIn: token_expiry },
                        (err, token) => {
                          if (err) {
                            res.status(500).json({ error: "Error signing token",
                                                   raw: err });
                          }
                          res.json({ status: 'success', token: `Bearer ${token}`, user: userDetails });
                }); 
              } else {
                res.status(401).json({error: 'Invalid password'});
              }
            });
          }).catch(err => console.error(err));
  });

  router.get(CONSTANTS.ENDPOINT.GRID, passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json(sampleData.textAssets);
  });
}

router.get(CONSTANTS.ENDPOINT.LOGOUT, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
          res.send('Error occured while destroying the session');
        } else {
          res.send('Session destroyed successfully');
        }
    });
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({
        'message': 'access denied'
    });
}

module.exports = router;
