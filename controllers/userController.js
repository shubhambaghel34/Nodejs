const User = require('../models/user');

const register = (req, res, next) => {
        const { name, email, password } = req.body;
        User.findOne({email:email})
        .then(function(currentUser){
            if (currentUser) {
                res.send('user is already registered').end();  
            } else {
                    var newUser = new User({
                      name: name,
                      email: email,
                      password: password
                    });
                
                    User.createUser(newUser, function(err, user){
                      if(err) throw err;
                      const userDetails = {
                        _id : user._id,
                        name : user.name,
                        email : user.email
                      }
                      res.json({status: 'success', user: userDetails});
                    });
            }
        }).catch(err => {
            console.error(err);
        });
}

module.exports = register;