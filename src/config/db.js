const { MongoClient, ServerApiVersion } = require('mongodb');

const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = 'vapo';

const uri = `mongodb+srv://marcosgnb00:${DB_PASSWORD}@vapo.ypijglf.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=vapo`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && database) return database;
  
  try {
    await client.connect();
    database = client.db(DB_NAME);
    isConnected = true;
    console.log("✅ Conexión exitosa a MongoDB Atlas");
    return database;
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
    throw error;
  }
}

// Función para obtener colecciones
async function getCollection(collectionName) {
  const db = await connectToDatabase();
  return db.collection(collectionName);
}

module.exports = { 
  connectToDatabase,
  getCollection,
  client // Exportamos el cliente para poder cerrar la conexión si es necesario
};