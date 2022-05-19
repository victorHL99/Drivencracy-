import express,{json} from 'express';
import chalk from 'chalk';
import cors from 'cors';
import dotenv from 'dotenv';
import {MongoClient} from 'mongodb';

const app = express();

dotenv.config();
app.use(cors());
app.use(json());

let dataBase = null;
const mongoCliente = new MongoClient(process.env.MONGO_URL);
const promise = mongoCliente.connect();
promise.then(response =>{
    dataBase = mongoCliente.db()
    console.log(chalk.green.bold('Banco de dados conectado com sucesso'));
});
promise.catch(error =>{
    console.log(chalk.red.bold('Erro ao conectar no banco de dados'));
});

const PORT  = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(chalk.green.bold(`Server is running on port ${PORT}`));
});
