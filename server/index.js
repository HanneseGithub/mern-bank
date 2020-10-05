const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/api.json');

// Middlewares
// Take requests in as JSON and handle them as JSON.
app.use(express.json());
// Enable cookie parsing everywhere
app.use(cookieParser());
// Enable cors
var corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
app.use(cors(corsOptions));

// Define the routes
const routes = require('./routes')

// When ... path is hit, use ...Router
app.use("/users", routes.usersRouter);
app.use("/sessions", routes.sessionsRouter);
app.use("/transfer", routes.transfersRouter);
app.use("/deposit", routes.depositRouter);
app.use("/withdraw", routes.withdrawRouter);
app.use("/balance", routes.balanceRouter);
app.use("/logout", routes.logoutRouter);
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
