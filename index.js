import express from "express";
import {
  conncetToMongoDataBase,
  getCollection,
  migrateToNEO4J,
} from "./database.js";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";
dotenv.config();
const URL4J = process.env.NEO4J_URI_CLOUD;
const USER4J = process.env.NEO4J_USER;
const PASS4J = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(URL4J, neo4j.auth.basic(USER4J, PASS4J));
const port = 3000;
const server = express();
server.use(express.json());

try {
  conncetToMongoDataBase();
  console.log("Conceted");
} catch (error) {
  console.error(error);
}
server.post("/produto", async (req, res) => {
  try {
    const { idprod, produto, quantidade, preco } = req.body;

    const newprod = { idprod, produto, quantidade, preco };

    try {
      const collection = getCollection("produtos");
      const resultProd = await collection.insertOne(newprod);
      res.status(201).json({
        message: "Dados do produto criados com sucesso!",
        resultProd,
      });
    } catch (error) {
      console.error("Erro ao inserir no banco de dados:", error);
      res.status(500).json({ error: "Erro ao adicionar produtos" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

// Rota para adicionar um produto (coleção Produtos)
server.post("/produto", async (req, res) => {
  try {
    const { idprod, produto, quantidade, preco } = req.body;
    const newprod = { idprod, produto, quantidade, preco };

    const collection = getCollection("produtos");
    const resultProd = await collection.insertOne(newprod);

    res.status(201).json({
      message: "Dados do produto criados com sucesso!",
      resultProd,
    });
  } catch (error) {
    console.error("Erro ao inserir no banco de dados:", error);
    res.status(500).json({ error: "Erro ao adicionar produtos" });
  }
});

// Rota para adicionar um cliente (coleção Cliente) com compras
server.post("/cliente", async (req, res) => {
  try {
    const {
      idCliente,
      cpfCliente,
      nome,
      email,
      endereco,
      compras,
      indicarAmigo,
    } = req.body;

    const newclient = {
      idCliente,
      cpfCliente,
      nome,
      email,
      endereco: {
        rua: endereco.rua,
        numero: endereco.numero,
        complemento: endereco.complemento || "",
        cidade: endereco.cidade,
        uf: endereco.uf,
        cep: endereco.cep,
      },
      compras: {
        idcompra: compras.idcompra,
        idprod: compras.idprod,
        data: compras.data,
        quantidade: compras.quantidade,
        valorpago: compras.valorpago,
      },
      indicarAmigo: {
        relacaoAmizade: indicarAmigo.relacaoAmizade,
        cpfAmigo: indicarAmigo.cpfAmigo,
        nomeAmigo: indicarAmigo.nomeAmigo,
        telefoneAmigo: indicarAmigo.telefoneAmigo,
        cidadeAmigo: indicarAmigo.cidadeAmigo,
        ufAmigo: indicarAmigo.ufAmigo,
      },
    };

    const collection = getCollection("clientes");
    const result = await collection.insertOne(newclient);

    res.status(201).json({
      message: "Dados do cliente criados com sucesso!",
      result,
    });

    migrateToNEO4J().catch(console.error);
  } catch (error) {
    console.error("Erro ao inserir cliente:", error);
    res.status(500).json({ error: "Erro ao adicionar cliente" });
  }
});

server.listen(port, () => {
  console.log(`Server on-line in port ${port}`);
});
console.log("hello");
