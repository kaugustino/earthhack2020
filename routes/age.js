var express = require('express');
var router = express.Router();




/* GET home page. */
router.post('/health-self-report', (req, res) => {
	const title = req.body.title
 	 //...
  	res.end()
});

module.exports = router;
