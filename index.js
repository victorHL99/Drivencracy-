import express,{json} from 'express';
import chalk from 'chalk';
import cors from 'cors';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';


const app = express();
app.use(cors());
app.use(json());
dotenv.config();

let dataBase = null;
const mongoCliente = new MongoClient(process.env.MONGO_URL);
const promise = mongoCliente.connect();
promise.then(response =>{
    dataBase = mongoCliente.db(process.env.DATABASE);
    console.log(chalk.green.bold('Banco de dados conectado com sucesso'));
});
promise.catch(error =>{
    console.log(chalk.red.bold('Erro ao conectar no banco de dados'));
});

//TODO - Rota para enviar a enquete /poll

app.post("/poll", async (req, res) => {
    console.log("Enquete enviada");
    const {title, expireAt} = req.body;
    const addDays = (30 * 86400000) // 30 dias em milisegundos
    const novaData = Date.now() + addDays; ;

    const poll = {
        title,
        expireAt: dayjs(new Date(novaData)).format('YYYY-MM-DD HH:mm:ss'),
    }

    const pollSchema = joi.object({
        title: joi.string().required(),
    })

    if(!expireAt){
        let expireAt = Date.now();
    }

    const validatePoll = pollSchema.validate({title});
    console.log(validatePoll);
    if(validatePoll.error){
        res.sendStatus(422);
        return;
    }

    try{
        const response = await dataBase.collection('polls').insertOne(poll);
        res.send(response).status(201);
    }
    catch(error){
        res.send(error).status(500);
    }

});

//TODO - Rota para receber as enquete /poll
app.get("/poll", async (req, res) => {

    try{
        const polls = await dataBase.collection('polls').find({}).toArray();
        res.send(polls).status(200);
    }
    catch(error){
        res.send(error).status(500);
    }
})

//TODO - Rota para criar a escolhas da enquetes /choice
app.post("/choice", async (req, res) => {
    const {title, pollId} = req.body;

    try{
        const polls = await dataBase.collection('polls').find({}).toArray();
        const poll = polls.find(poll => poll._id == pollId);

        if(!poll){
            res.sendStatus(404);
            return;
        }

        const choicePollSchema = joi.object({
            title: joi.string().required(),
        });
        
        const validateChoicePoll = choicePollSchema.validate({title});
        
        if(validateChoicePoll.error){
            res.sendStatus(422);
            return;
        }

        const choices = await dataBase.collection('choices').find({}).toArray();
        const choice = choices.find(choice => choice.title == title);

        if(choice){
            res.sendStatus(409);
            return;
        }

        if(poll.expireAt < Date.now()){
            res.status(403).send('Enquete expirada');
            return;
        }

        const response = await dataBase.collection('choices').insertOne({title, pollId});
        res.send(response).status(201);
    }
    catch(error){
        res.send(error).status(500);
    }

})

//TODO - Rota para receber as escolhas da enquetes /choice
app.get(`/poll/:id/choice`, async (req, res) => {
    const {id} = req.params;

    try{
        const choices = await dataBase.collection('choices').find({pollId: id}).toArray();
        if(choices.length == 0){
            res.sendStatus(404);
            return;
        }
        res.send(choices).status(200);

    }
    catch(error){
        res.send(error).status(500);
    }
});

app.listen(5000,()=>{
    console.log(chalk.green.bold(`Server is running on port 5000`));
});
