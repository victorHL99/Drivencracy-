import express,{json} from 'express';
import chalk from 'chalk';
import cors from 'cors';
import dotenv from 'dotenv';
import {MongoClient, ObjectId} from 'mongodb';
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
    if(validatePoll.error){
        res.sendStatus(422);
        return;
    }

    try{
        console.log(chalk.green(`Enviando a enquete ${title}`));
        const response = await dataBase.collection('polls').insertOne(poll);
        res.status(201).send(response);
    }
    catch(error){
        console.log(chalk.red(error));
        res.status(500).send(error);
    }

});

//TODO - Rota para receber as enquete /poll
app.get("/poll", async (req, res) => {

    try{
        const polls = await dataBase.collection('polls').find({}).toArray();
        res.status(200).send(polls);
    }
    catch(error){
        res.status(500).send(error);
    }
})

//TODO - Rota para criar a escolhas da enquetes /choice
app.post("/choice", async (req, res) => {
    const {title, pollId} = req.body;
    const votes = 0;

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

        const response = await dataBase.collection('choices').insertOne({title, pollId, votes});
        res.status(201).send(response);
    }
    catch(error){
        res.status(500).send(error);
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
        res.status(200).send(choices);

    }
    catch(error){
        res.status(500).send(error);
    }
});

//TODO - Rota para enviar votos /vote
app.post(`/choice/:id/vote`, async (req, res) => {
    const {id} = req.params;
    try{
        const choices = await dataBase.collection('choices').find({_id: new ObjectId(id)}).toArray();
        const poll = await dataBase.collection('polls').find({_id: new ObjectId(choices[0].pollId)}).toArray();
        
        const choice = choices[0];
        if(choices.length === 0){
            res.sendStatus(404);
            return;
        }

        if(poll[0].expireAt < Date.now()){
            res.sendStatus(403);
            return;
        }


        const newVotes = choice.votes + 1;
        const response = await dataBase.collection('choices').updateOne({_id: new ObjectId(id)}, {$set: {votes: newVotes}});

        res.status(201).send(response);
    }
    catch(error){
        res.status(500).send(JSON.stringify(error));
    
    }
})

//TODO - Rota para receber os votos /vote
app.get(`/poll/:id/result`, async (req, res) => {
    const {id} = req.params;
    

    try{
        const choices = await dataBase.collection('choices').find({pollId: id}).toArray();
        const poll = await dataBase.collection('polls').find({_id: ObjectId(id)}).toArray();

        let votes = 0;
        let title = '';
        choices.forEach(choice => {
            if(choice.votes > votes){
                votes = choice.votes;
                title = choice.title;
            }
        })
        const result = {
            _id: id,
            title: poll[0].title,
            expireAt: poll[0].expireAt,
            result:{
                title,
                votes
            }

        }
        res.status(200).send(result);

    }
    catch(error){
        res.status(500).send(error);
    }
})


const port = process.env.PORT ;
app.listen(port,()=>{
    console.log(chalk.green.bold(`Servidor rodando na porta ${port}`));
});
