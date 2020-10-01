const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/api.json');

// Middlewares
// Take requests in as JSON and handle them as JSON.
app.use(express.json());
// Enable cors
app.use(cors());

// Docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Database connection
mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true
  },
  () => console.log("Successfully to the database!")
);

// Listen to the server
const port = process.env.PORT || 9001;

app.listen(port, () => {
  console.log(`Server kuulab port ${port} peal!`);
});