const express = require("express");
const auth = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");
const User = require("../../models/mongoDB/User");
const Dossier = require("../../models/mongoDB/Dossier");
const crypto = require('crypto-random-string');
const sendMail = require('../../services/Mail');
const chalk = require('chalk')

function httpValidation(input, type) {
    let schema;
    if (type === 'register')
        schema = {
            email: Joi.string()
                .min(3)
                .required(),
            password: Joi.string()
                .min(3)
                .required(),
            firstName: Joi.string().min(1).max(50).required(),
            lastName: Joi.string().min(1).max(50).required()
        }
    else if (type === 'login')
        schema = {
            email: Joi.string()
                .min(3)
                .required(),
            password: Joi.string()
                .min(3)
                .required()
        }
    else if (type === 'mailresent')
        schema = {
            email: Joi.string()
                .min(3)
                .required()
        }
    else if (type === 'verifymail')
        schema = {
            secretCode: Joi.string()
                .min(35)
                .max(35)
                .required(),

        }


    return Joi.validate(input, schema);
}


auth.post('/', (req, res) => {

    return res.json(req.body)
})
auth.post('/register', async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
    } = req.body;
    const {
        error
    } = httpValidation(req.body, 'register');


    if (error) return res.status(400).send(error.details[0].message);
    const secretCode = crypto({
        length: 35,
        type: 'url-safe'
    });
    const today = new Date();
    const userData = {
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        created: today,
        role: 'candidat',
        firstTimelogged: true,
        activationCode: secretCode,
        isAdmin: false,
        isActive: false
    };
    try {
        const userIsFound = await User.findOne({
            email: userData.email
        })
        if (userIsFound) return res.status(409).json({
            err: "Email dejà enregistré",
            code: 409
        })
    } catch (err) {
        return res.status(500).json({
            err
        })
    }


    const hashedpassword = await bcrypt.hash(password, 10);
    userData.password = hashedpassword;
    //TODO SEND MAIL done 

    try {
        await User.create(userData);
        sendMail(email, firstName, secretCode)
            .then(() => console.log('Mail sent !'))
        return res.status(201).json({
            msg: "utilisateur crée",
            code: 201
        });

    } catch (err) {
        return res.status(500).json({
            err
        });
    }


});
auth.post('/login', async (req, res) => {

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
    if (!userFound) return res.status(401).json({
        err: "Utilisateur / mot de passe incorrect",
        code: 401
    })

    const passwordMatch = bcrypt.compareSync(password, userFound.password)
    
    let payload = {
        id: userFound._id,
        email: userFound.email,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        isAdmin: userFound.isAdmin,
        isActive: userFound.isActive,
        firstLogged: userFound.firstTimelogged,
        candidatureID: userFound.candidatureNumber
    }
    if (userFound.firstTimelogged) {
        userFound.firstTimelogged = false
        await userFound.save()
    }
    let token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: 7200
        //2hours
    });

    if (passwordMatch && userFound.isActive) {
        return res.status(200).json({
            token,
            user: {
                id: userFound._id,
                email: userFound.email,
                created: userFound.created
            }
        });
    } else if (passwordMatch && !userFound.isActive) return res.status(200).json({
        msg: "Compte non activé !",
        token: token
    })
    else
        return res.status(401).json({
            err: "Utilisateur / mot de passe incorrect",
            code: 401
        })



});


//? @POST verify the mail , require (secretCode )
//? from the body set acount to isActive in db if it match.
//? @ SHOULD BE a protected route
auth.post('/verifymail', async (req, res) => {
    //TODO mail verify
    const {
        secretCode
    } = req.body
    const {
        error
    } = httpValidation(req.body, 'verifymail');
    if (error) return res.status(400).send(error.details[0].message);

    const userFound = await User.findOne({
        activationCode: secretCode
    })

    if (!userFound) return res.status(401).json({
        err: "Utilisateur / mot de passe incorrect",
        code: 401
    })
    if (userFound.isActive) return res.status(400).json({
        err: 'Compte déja activé',
        code: 400
    })
    if (!userFound.isActive && userFound.activationCode === secretCode) {
        userFound.isActive = true
        res.status(200).json({
            msg: "Compte activé avec succés!",
            code: 200,
        })

    } else if (userFound.activationCode !== secretCode) return res.status(400).json({
        err: 'Code de verification incorrect',
        code: 409
    })
    const initialDossierData = {
        candidat: {
            prenom: userFound.firstName,
            nom: userFound.lastName
        },
        step: [{
            nom: "step1",
            done: false
        }, {
            nom: "step2",
            done: false
        }, {
            nom: "step3",
            done: false
        }, {
            nom: "step4",
            done: false
        }],
        administrationStep: 0
    }

    try {
        const newDossier = new Dossier(initialDossierData)
        await newDossier.save()
        userFound.candidatureNumber = newDossier._id
        await userFound.save()
    } catch (err) {
        console.log(err)

    }


});
//? @POST send another mail with the secretcode from db require ( email )
//? @Private route
auth.post('/mailresent', async (req, res) => {
    const {
        email,
    } = req.body
    const {
        error
    } = httpValidation(req.body, 'mailresent');
    if (error) return res.status(400).send(error.details[0].message)

    const userFound = await User.findOne({
        email
    })
    if (!userFound) return res.status(401).json({
        "err": "Utilisateur / mot de passe incorrect",
        "code": 401
    })
    sendMail(userFound.email, userFound.firstName, userFound.activationCode)
        .then(() => res.status(200).json({
            msg: 'Mail sent!',
            code: 200
        }))
        .catch(err => res.status(502).json({
            err
        }))
});
//! TODO 
auth.get('/passwordreset', (req, res) => {
    console.log('passwordreset request');
})



module.exports = auth