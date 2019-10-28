const mongoose = require('../../config/databaseAuth/cachedb');
const Schema = mongoose.Schema


const DossierScheme = new Schema({
    candidat: {
        type: Object,
        required: true
    },
    step: {
        type: [Object],
        required: true,
    },
    administrationStep: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    }






})

const Dossier = mongoose.model('Dossier', DossierScheme)
module.exports = Dossier