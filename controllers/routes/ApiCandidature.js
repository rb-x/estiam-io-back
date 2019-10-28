const candidature = require('express').Router()
const auth = require('../../middlewares/custom-auth')
const adminauth = require('../../middlewares/custom-auth-admin')
const Dossier = require('../../models/mongoDB/Dossier')
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')





candidature.get('/all', adminauth, async (req, res) => {

    let data = await Dossier.find({})
    let finalDta = data.filter(d =>
        !d.step.map(done => done.done).includes(false)
    )
    return res.send(finalDta)
})
candidature.get('/stat', adminauth, async (req, res) => {

    try {
        const allCandidatures = await Dossier.find({})
        const AllStepDone = allCandidatures.filter(d =>
            !d.step.map(done => done.done).includes(false)
        ).length
        const firstStepDone = allCandidatures.filter(d =>
            d.step[0].done
        ).length
        const secondStepDone = allCandidatures.filter(d =>
            d.step[1].done
        ).length
        const thirdStepDone = allCandidatures.filter(d =>
            d.step[2].done
        ).length
        return res.status(200).json({
            data: {
                allStepDone: AllStepDone,
                firstStepDone: firstStepDone,
                secondStepDone: secondStepDone,
                thirdStepDone: thirdStepDone
            }
        })
    } catch (ex) {
        console.log(ex)
        return res.json({
            ex
        })
    }


})
candidature.post('/sendfile', auth, async (req, res) => {
    //recup token {name + dossier }
    const date = Date.now()
    const dir = `./uploadFile/${req.user.firstName}_${req.user.lastName}_${date}`
    fs.ensureDirSync(dir)
    // console.log(req.files)
    const upload = multer({
        storage: multer.diskStorage({
            destination: dir,
            filename: function (req, file, cb) {
                cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
            }
        })
    }).any();

    upload(req, res, function (err, filedata) {
        if (err) {
            res.json({
                error_code: 1,
                err_desc: err
            });

        } else {
      
 
            res.json({
                msg: "ok sent !"
            });

        }
    })
    let userFound = undefined;
    try {
        userFound = await Dossier.findById(req.user.candidatureID)
    } catch (ex) {
        console.log(ex)
    }
    if (!userFound) return res.status(400).json({
        err: "user in db not found"
    })

    //to base 64 
    const appDir = path.dirname(require.main.filename)
    uploadDir = path.join(appDir, "uploadFile", `${req.user.firstName}_${req.user.lastName}_${date}`)
    const files = fs.readdirSync(uploadDir)
    const photo = files.find(file => {
        
        return file.split("-")[0] === "photo"
    });

    if (!photo) {
   
        return res.send('file not found !')
    }
    const base64str = fs.readFileSync(path.join(uploadDir, photo), {
        encoding: 'base64'
    });
    // appel bdd -> overwrite -> ajout base64 photo.

    try {
        userFound.candidat = {
            ...userFound.candidat,
            photo_identitee: base64str
        }
        await userFound.save()
    } catch (ex) {
        console.log(ex)

    }

})

candidature.get('/:id', async (req, res) => {
    const {
        id
    } = req.params
    try {
        const dossierFound = await Dossier.findById(id)
        if (!dossierFound) return res.send('Not found')

        res.json({
            data: dossierFound
        })
    } catch (err) {
        return res.status(400).json({
            err: "invalid request"
        })
    }

})
//update etape 1 2 3
candidature.put('/:id', auth, async (req, res) => {
    const {
        id
    } = req.params
    const {
        candidat,
        step
    } = req.body

    if (req.user.candidatureID !== req.params.id && !req.user.isAdmin) return res.status(401).json({
        err: "Unauthorized to edit this document with the provided token "
    })
    try {

        const dossierFound = await Dossier.findById(id)
        dossierFound.candidat = candidat
        dossierFound.step = step

        await dossierFound.save()
        res.status(200).json({
            data: dossierFound
        })
    } catch (ex) {
        res.status(500).json({
            msg: ex
        })
    }


})
// update de l'etape administration 
candidature.put('/step/:id', async (req, res) => {
    const {
        id
    } = req.params
    const {
        step
    } = req.body
    try {

        const dossierFound = await Dossier.findById(id)
        dossierFound.administrationStep = step
        await dossierFound.save()
        const allCandidatures = await Dossier.find({})
        const finlData = allCandidatures.filter(d =>
            !d.step.map(done => done.done).includes(false)
        )
        return res.status(201).json({
            data: finlData
        })
    } catch (ex) {
        console.log(ex)
        return res.status(400).json({
            err: ex
        })
    }




})



module.exports = candidature