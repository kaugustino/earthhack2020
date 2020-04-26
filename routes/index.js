var express = require('express');
var router = express.Router();

const { Client, AccountBalanceQuery, FileCreateTransaction, Ed25519PrivateKey, Hbar, FileContentsQuery } = require("@hashgraph/sdk");
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
        .setContents(JSON.stringify(req.body))
        .addKey(operatorPublicKey) // Defines the "admin" of this file
        .setMaxTransactionFee(new Hbar(15))
        .execute(client);

    const receipt = await transactionId.getReceipt(client);
    res.locals.receipt = receipt;

    console.log(receipt);
    next();
}

var getFileContent = async function (req, res, next) {
    const fileContent = await new FileContentsQuery()
        .setFileId(res.locals.receipt.getFileId())
        .execute(client);

    res.locals.fileContent = new TextDecoder("utf-8").decode(fileContent);

    console.log("file content is " + res.locals.fileContent);
    next();
}

var getBalance = async function (req, res, next) {
    const balance = await new AccountBalanceQuery()
        .setAccountId(operatorAccount)
        .execute(client);

    res.locals.balance = balance;

    console.log("My account balance: " + balance);
    next();
}

/* GET home page. */
router.get('/', getBalance, function(req, res, next) {
    res.render('index', { title: 'CryptoCare', balance: res.locals.balance });
});

router.post('/', writeFileTransaction, getFileContent, function(req, res) {
    res.render('submissionPage', { status: res.locals.receipt.status, fileId: res.locals.receipt.getFileId(), transaction: JSON.parse(res.locals.fileContent)});
});

module.exports = router;
