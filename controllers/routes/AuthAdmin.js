const express = require("express");
const Joi = require('@hapi/joi')
const admin = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../../models/mongoDB/User");
const bcrypt = require('bcryptjs')

function httpValidation(input) {
    let schema = {
        email: Joi.string()
            .min(3)
            .required(),
        password: Joi.string()
            .min(3)
            .required()
    }
    return Joi.validate(input, schema);
}


admin.post('/login', async (req, res) => {
    const {
        email,
        password
    } = req.body

    const {
        error
    } = httpValidation(req.body, 'login');
    if (error) return res.status(400).send(error.details[0].message);
    const userFound = await User.findOne({
        email
    })

    if (!userFound || !userFound.isAdmin) return res.status(401).json({
        err: "Utilisateur / mot de passe incorrect !",
        code: 401
    })


    const passwordMatch = bcrypt.compareSync(password, userFound.password)
    let payload = {
        id: userFound._id,
        email: userFound.email,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        isAdmin: userFound.isAdmin,
    }
    let token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: 7200
        //2hours
    });

    if (passwordMatch) {
        return res.status(200).json({
            token,
            user: {
                id: userFound._id,
                email: userFound.email,
                created: userFound.created
            }


        })
    } else {
        return res.status(401).json({
            err: "Utilisateur / mot de passe incorrect",
            code: 401
        })
    }
})

module.exports = admin