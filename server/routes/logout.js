const express = require("express");
const router = express.Router();

router.post('/', async (req, res) => {
  res.clearCookie("authorization");
  res.status(200).send('You have logged out - session token has been deleted!')
});

module.exports = router;