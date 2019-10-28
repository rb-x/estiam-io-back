const express = require("express");
const users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");

// Import Sequelize model User
const User = require("../../models/User");
users.use(cors());

process.env.SECRET_KEY = "secret";

//JOI HTTP Validation
function validation(input) {
    const schema = {
        email: Joi.string()
            .min(3)
            .required(),
        password: Joi.string()
            .min(3)
            .required()
    };
    return Joi.validate(input, schema);
}

//@route : public

users.post("/register", async (req, res) => {
    const {
        email,
        password
    } = req.body;
    const today = new Date();
    const userData = {
        email: email,
        password: password,
        created: today
    };
    const {
        error
    } = validation(req.body);
    if (error) return res.status(400).send(error.details[0].message);


    const user = await User.findOne({
        where: {
            email: req.body.email
        }

    }).catch(err => res.status(500).json({
        err
    }))


    //! User already exist handler
    if (user)
        return res.status(500).json({
            msg: "user already exists",
            userExistAs: email
        });

    const hashedpassword = await bcrypt.hash(password, 10);
    userData.password = hashedpassword;

    try {
        await User.create(userData);
    } catch (ex) {
        res.status(500).json({
            err: ex
        });
    }
    res.json("successfully registred");
});

users.post("/login", async (req, res) => {
    const {
        email,
        password
    } = req.body;
    console.log("login requestest", req.body);

    const {
        error
    } = validation(req.body);
    if (error)
        return res.status(400).json({
            err: error.details[0].message
        });



    const user = await User.findOne({
        where: {
            email: email
        }
    }).catch(err => res.json({
        err
    }))




    //! password & email checking
    if (user) {
        if (bcrypt.compareSync(password, user.dataValues.password)) {
            // * 1440 sec -> 24 mn (standard session time)
            let token = jwt.sign(user.dataValues, process.env.SECRET_KEY, {
                expiresIn: 1440
            });
            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    created: user.created
                }
            });
        } else {
            // ! incorrect password
            res.status(400).send({
                msg: "incorrect mail or password "
            });
        }
    }
});

users.post("/verification", (req, res) => {
    res.send('Verif ok !')
})

module.exports = users;