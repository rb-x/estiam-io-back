const express = require("express");
const app = express();
require('dotenv').config()
const cors = require('cors')
const helmet = require('helmet')
const auth = require('./middlewares/custom-auth')
const port = process.env.PORT || 8080;
const morgan = require('morgan')
const bodyLogger = require('./middlewares/bodyLogger.js')
// const db = require('./config/databaseAuth/sqldb')
const Dossier = require('./models/mongoDB/Dossier');
const fileUpload = require('express-fileupload')


//  here sql test request
// db.connect

app.use(cors())
app.use(morgan('dev'))
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.use(bodyLogger)

const Users = require('./controllers/routes/Users')
const Auth = require('./controllers/routes/Auth')
const AuthAdmin = require('./controllers/routes/AuthAdmin')
const ApiCandidature = require('./controllers/routes/ApiCandidature')



app.use('/users', Users)
app.use('/auth', Auth)
app.use('/admin', AuthAdmin)
app.use('/api/candidature', ApiCandidature)

app.get("/", (req, res) => {
  res.json({
    msg: "Express Home page ! ... "
  });
});


app.post("/cachedb", async (req, res) => {
  const {
    data
  } = req.body
  const newDossier = new Dossier(data)
  const result = await newDossier.save()
  return res.json({
    result
  })
});

//test auth route 
app.get('/dashboard', auth, (req, res, next) => {
  return res.send(req.user, "welcome to the dashboard")
})

app.listen(port, () => console.log(`Listening on port ${port}... `));