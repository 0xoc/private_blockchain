/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {


    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            await this._prepareAndAddNewBlockToTheChain(self, block);
            resolve(block);
        });
    }

    async _prepareAndAddNewBlockToTheChain(self, block) {
        await this._prepateNewBlock(self, block);
        this._addNewBlockToTheChain(self, block);
    }

    async _prepateNewBlock(self, block) {
        let { newHeight, time, currentHeight } = await this._getNewBlockAttrs(self);
        this._setNewBlockAttrs(block, newHeight, time, currentHeight, self);
    }

    _addNewBlockToTheChain(self, block) {
        self.chain.push(block);
        self.height += 1;
        console.log(`[blockchain] added block #${block.height} to the chain`);
    }

    _setNewBlockAttrs(block, newHeight, time, currentHeight, self) {
        block.height = newHeight;
        block.time = time;

        if (currentHeight < 0)
            block.previousBlockHash = "";

        else
            block.previousBlockHash = self.chain[currentHeight].hash;

        block.hash = SHA256(JSON.stringify(self)).toString();
        console.log(`[blockchain] ${block.hash}`);
    }

    async _getNewBlockAttrs(self) {
        let currentHeight = await self.getChainHeight();
        let newHeight = currentHeight + 1;
        let time = new Date().getTime().toString().slice(0, -3);
        return { newHeight, time, currentHeight };
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let block = this._createNewStarBlock(message, address, signature, reject, star);
            resolve(await self._addBlock(block));

        });
    }


    _createNewStarBlock(message, address, signature, reject, star) {
        this._validateSubmitStarRequest(message, address, signature, reject);
        let block = new BlockClass.Block({ address, message, signature, star });
        return block;
    }

    _validateSubmitStarRequest(message, address, signature, reject) {
        if (!bitcoinMessage.verify(message, address, signature))
            reject("Invalid Signature");

        this._validateSubmitStarExpirationTime(message, reject);
    }

    _validateSubmitStarExpirationTime(message, reject) {
        let messageTimeStamp = parseInt(message.split(':')[1]);
        let currentTimeStamp = parseInt(new Date().getTime().toString().slice(0, -3));
        let fiveMinsSeconds = 5 * 60;
        let diff = currentTimeStamp - messageTimeStamp;

        if (diff > fiveMinsSeconds)
            reject("Message expired");
    }

    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
           resolve(self.chain.find((e) => e.hash == hash))
        });
    }

    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            console.log(`[blockchain] ${JSON.stringify(block)}`);
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    getStarsByWalletAddress (address) {
        let self = this;
        let stars = [];
        
        return new Promise((resolve, reject) => {
            self.chain.forEach((block) => {
                let data = block.getBData();

                if (data && data['address'] == address){
                    stars.push(data['star'])
                }
            });

            resolve(stars)
        });
    }


    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.chain.forEach(async (block) => {
                let isValid = await block.validate();
                
                // ignore genesis block
                if (block.height <= 0)
                    return;
                
                if (!isValid){
                    errorLog.push(`Block #${block.height} is not valid`);
                    return;
                }

                let prevBlock = self.getBlockByHeight(block.height - 1);
                if (block.previousBlockHash != prevBlock.hash)
                    errorLog.push(`Block #${block.height} has invalid prev block hash`);

            });
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;   