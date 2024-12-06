import { MongoClient, ServerApiVersion } from "mongodb";
import neo4j from "neo4j-driver";
import dotenv from "dotenv";
dotenv.config();

const URL4J = process.env.NEO4J_URI_CLOUD;
const USER4J = process.env.NEO4J_USER;
const PASS4J = process.env.NEO4J_PASSWORD;
const urlMongo = process.env.MONGO_URI_CLOUD;

const driver = neo4j.driver(URL4J, neo4j.auth.basic(USER4J, PASS4J));

const client = new MongoClient(urlMongo, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export function getCollection(collectionName) {
  const db = client.db("Users");
  return db.collection(collectionName);
}

export async function migrateToNEO4J() {
  const mongoCollection = getCollection("clientes");
  const sessionNeo4j = driver.session();

  try {
    const clients = await mongoCollection.find({}).toArray();

    for (const client of clients) {
      // Formatar os amigos como uma lista de objetos
      const amigos = Array.isArray(client.indicarAmigo)
        ? client.indicarAmigo
        : [client.indicarAmigo].filter(Boolean);

      await sessionNeo4j.run(
        `
        MERGE (c:Cliente {
          idCliente: $idCliente, 
          cpfCliente: $cpfCliente, 
          nome: $nome, 
          email: $email,
          cidade: $cidade,
          uf: $uf
        })
        `,
        {
          idCliente: client.idCliente,
          cpfCliente: client.cpfCliente,
          nome: client.nome,
          email: client.email,
          cidade: client.endereco.cidade,
          uf: client.endereco.uf,
        }
      );

      if (amigos.length > 0) {
        for (const amigo of amigos) {
          await sessionNeo4j.run(
            `
              MATCH (c:Cliente {cpfCliente: $cpfCliente})
              MERGE (a:Amigo {
                cpf: $cpfAmigo, 
                nome: $nomeAmigo, 
                telefone: $telefoneAmigo, 
                cidade: $cidadeAmigo, 
                uf: $ufAmigo
              })
              CREATE (c)-[:AMIGO_DE {relacao: $relacaoAmizade}]->(a)
            `,
            {
              cpfCliente: client.cpfCliente,
              cpfAmigo: amigo.cpfAmigo,
              nomeAmigo: amigo.nomeAmigo,
              telefoneAmigo: amigo.telefoneAmigo,
              cidadeAmigo: amigo.cidadeAmigo,
              ufAmigo: amigo.ufAmigo,
              relacaoAmizade: amigo.relacaoAmizade,
            }
          );
        }
      }
    }

    console.log("Dados migrados para o Neo4j com sucesso.");
  } catch (error) {
    console.error("Erro ao conectar ao Neo4j:", error);
  } finally {
    await sessionNeo4j.close();
  }
}

export async function conncetToMongoDataBase() {
  try {
    await client.connect();
    console.log("Conexão estabelecida - Mongo");
  } catch (error) {
    console.log("Erro ao conectar com o banco de dados", error);
  }
}

// conncetToNEO4JDataBase().catch(console.error);

/* database:
MONGODB:
username: bernardonodemailer
pass: Fq9WQirj1vd3xppn 
NEO4J: 
username: neo4jAv0HqQpGoLu7TQD0qO73-R9j18k9ZNIaIFYpeNck720
*/
