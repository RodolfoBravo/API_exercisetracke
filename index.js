const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config({ path: 'sample.env'})

// Connection with database
const connection = mongoose.connection;
connection.on('error',console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("Connection with database mongo correct")
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const usersSchema = new Schema({
  _id: ObjectId,
  username: String,
});

const users = mongoose.model("Users",usersSchema);

const exerciseSchema = new Schema({
    id: {
        type: String
    },
    description: {
        type: String,
        maxlength: [25, 'Description too long']
    },
    duration: {
        type: Number,
        min: [1, 'Duration too short']
    },
    date: {
        type: Date
    },
    
})

const exercise = mongoose.model("Exercise",exerciseSchema)


app.use(cors())

app.use(bodyParser.urlencoded());

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users',async function (req,res){
  try {
        let message = 'Registros encontrados';
        let findAll = await users.find({},{username:1,_id:1}).exec();
        console.log(findAll);
        if(!findAll.length) {
            message = 'No existen registros';
        }
        
        return res.json(
          findAll
        );
    }
    catch(e) {
        console.error(e);
        let message = 'Error en la consulta';
        return res.status(500).json({
            message
        });
    }
  
})

app.post('/api/users', async function (req, res) {
  var username = req.body.username;
  console.log(username);

  
  let findOne = await users.findOne({
      username: username
    });
  if (findOne) {
      res.json({
        username: findOne.username,
        _id: findOne._id
      })
    } else{
      findOne = new users({
        username: username,
        _id: new mongoose.Types.ObjectId()
      })
      await findOne.save()
      res.json({
        username:findOne.username, 
        _id:findOne._id});
    }
  
})


app.post('/api/users/:_id/exercises', async function (req,res) {
  var { description, duration, date } = req.body;
  const id = req.params._id;
  if (date == ''){
    var dateFormat = new Date();
  }
  else{
    dateFormat = new Date(date);
    if (dateFormat == 'Invalid Date'){
      dateFormat = new Date();
    }
  }
  console.log(id, description, duration, dateFormat);
      findOne = new exercise({
        id: id,
        date: dateFormat,
        duration: duration,
        description: description
      });
      let findUser = await users.findOne({
        _id: id
    });
      if (findUser){
      await findOne.save();
        let dateformat = findOne.date.toDateString()
      res.json({
        _id: findUser._id,
        username: findUser.username,
        date: dateformat,
        duration: findOne.duration,
        description: findOne.description
    });
      } else {
      res.json({error:'user not found'})
      }   

})

app.get('/api/users/:_id/logs',async function (req,res){
  console.log('/api/users/:_id/logs')
  try {
        let id = req.params._id;
        const { from, to, limit } = req.query;
          var query = {
                        id:id
                      }
         if (from !== undefined && to === undefined) {
            query.date = { $gte: new Date(from)}
          } else if (to !== undefined && from === undefined) {
            query.date = { $lte: new Date(to) }
          } else if (from !== undefined && to !== undefined) {
            query.date = { $gte: new Date(from), $lte: new Date(to)}
          }
      let lim = 0;
        if (limit !== undefined){
              lim = parseInt(limit);
            } else{
              lim = 0;
            }
      console.log('data',req.query)
        console.log('data optional',from, to, limit)
        let message = 'Registros encontrados';
        let findExercise = await exercise.find(query,{_id:0,id:0,__v:0}).limit(lim).exec();
        console.log(findExercise);
        if(!findExercise.length) {
            message = 'No existen registros';
        }
        else{
          let findUser = await users.findOne({
        _id: id
        });
        if (findUser){
          let loggedArray = findExercise.map((item) => {
            return {
              "description": item.description,
              "duration": item.duration,
              "date": item.date.toDateString()
            }
          })
          console.log(loggedArray);
        return res.json(
         { _id:findUser._id,
          username:findUser.username,
          count:findExercise.length,
          log: loggedArray
          
         });
        }
    }
  }catch(e) {
        console.error(e);
        let message = 'Error en la consulta';
        return res.status(500).json({
            message
        });
    }
  
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
