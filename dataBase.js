import {MongoClient} from 'mongodb';
import chalk from 'chalk';

import dotenv from 'dotenv';

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

export default dataBase;