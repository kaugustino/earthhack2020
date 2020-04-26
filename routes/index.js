var express = require('express');
var router = express.Router();

const { Client, AccountBalanceQuery, FileCreateTransaction, Ed25519PrivateKey, Hbar } = require("@hashgraph/sdk");
require("dotenv").config();

const operatorAccount = process.env.OPERATOR_ID;
const operatorPrivateKey = Ed25519PrivateKey.fromString(process.env.OPERATOR_KEY);
const operatorPublicKey = operatorPrivateKey.publicKey;

if (operatorPrivateKey == null || operatorAccount == null) {
    throw new Error("environment variables OPERATOR_KEY and OPERATOR_ID must be present");
}

const client = Client.forTestnet()
client.setOperator(operatorAccount, operatorPrivateKey);

var writeFileTransaction = async function (req, res, next) {

    const transactionId = await new FileCreateTransaction()
        .setContents(req.body)
        .addKey(operatorPublicKey) // Defines the "admin" of this file
        .setMaxTransactionFee(new Hbar(15))
        .execute(client);

    const receipt = await transactionId.getReceipt(client);
    console.log("new file id = ", receipt.getFileId());
    next();
}

var getBalance = async function (req, res, next) {
    const balance = await new AccountBalanceQuery()
        .setAccountId(operatorAccount)
        .execute(client);

    console.log("My account balance: " + balance);
    res.locals.balance = balance;
    next();
}

/* GET home page. */
router.get('/', getBalance, function(req, res, next) {
    res.render('index', { title: 'Express', balance: res.locals.balance });
});

router.post('/', writeFileTransaction, function(req, res) {
    res.redirect('submission_page');
});

router.get('/submission_page', function(req, res, next) {
    res.render('submission_page');
})

module.exports = router;
