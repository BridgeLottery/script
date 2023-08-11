//Imports
const axios = require('axios');
const depositorABI = require('./ABIjson/depositorAbi.json');
const { ethers } = require('ethers');
const fs = require('fs');
const { EAS, SchemaEncoder } = require("@ethereum-attestation-service/eas-sdk");
const randomNumberABI = require('./ABIjson/randomNumberAbi.json');
const Web3 = require('web3');
const configPath = './config.json';
const zoraAbi = require('./ABIjson/zoraDropAbi.json')

//Read and parse the config.json file
const configFile = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configFile);
let depositorContract;
//Connection to goerli the network in our case
let web3Url = config.web3Socket.replace('$web3Key', config.web3Key);
let web3Sub = new Web3(web3Url);
//connection to sepolia network
web3Url = config.yourEndpointUrl.replace('$yourEndpointKey' , config.yourEndpointKey)
let web3 = new Web3(web3Url)

//Must be the address who deploy the contracts
web3.eth.defaultAccount = config.fromAddress;

//Tx hash
let hash;

//Transactions count
let nonce;

//Gas price
let estimatedGas;
let suggestedGasPrice;

//Subscription duration
const subscriptionDurationInSeconds = 120;

//Deploy a new contract
const deploy = async () => {

    const nonce = await web3.eth.getTransactionCount(config.fromAddress);
    const deployTransaction = {    
        from: config.fromAddress,
        data: config.contractBytecode,
        nonce: nonce,
        gasPrice: await web3.eth.getGasPrice() * config.gasPriceModifier, // Adjust gas price as needed
    };
    try {
        estimatedGas = await web3.eth.estimateGas(deployTransaction);
        deployTransaction.gas = estimatedGas * config.gasLimitModifier; // Set the gas limit based on the estimation
    } catch (error) {
        console.error('Error estimating gas:', error);
        return;
    }
const signedTransaction = await web3.eth.accounts.signTransaction(deployTransaction, config.privateKey);
    const contract = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log('Contract deployed at:', contract.contractAddress);
    return contract.contractAddress; // Return the deployed contract address
};

deploy().then(deployedContractAddress => {
    // Create a contract instance
    depositorContract = new web3.eth.Contract(depositorABI, deployedContractAddress);
    main();
}).catch(error => {
    console.error('Error deploying contract:', error);
});
