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
            await self._prepareAndAddNewBlockToTheChain(block);
            resolve(block);
        });
    }

    async _prepareAndAddNewBlockToTheChain(block) {
        await this._prepateNewBlock(block);
        this._addNewBlockToTheChain(block);
    }

    async _prepateNewBlock(block) {
        let {newHeight, time, prevHash} = await this._getNewBlockAttrs();
        block.height = newHeight;
        block.time = time;
        block.previousBlockHash = prevHash;
        block.hash = SHA256(JSON.stringify(block)).toString();
    }

    async _getNewBlockAttrs() {
        let currentHeight = await this.getChainHeight();
        let prevHash = await this._getAppropriatePrevHash();
        let newHeight = currentHeight + 1;
        let time = new Date().getTime().toString().slice(0, -3);
        return { newHeight, time, prevHash};   
    }

    _addNewBlockToTheChain(block) {
        this.chain.push(block);
        this.height += 1;
    }

    async _getAppropriatePrevHash() {
        let currentHeight = await this.getChainHeight();

        if (currentHeight < 0)
                return ""
        else
            return this.chain[currentHeight].hash;
    }

    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`${address}:${new Date().getTime().toString().slice(0,-3)}:starRegistry`);
        });
    }

    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {

            if (!self._isSigValid(message, address, signature))
                reject("Invalid Signature");

            if (self._isSubmissionMessageExpired(message))
                reject("submission message is expired");
            
            let block = new BlockClass.Block({ address, message, signature, star });
            await self._addBlock(block)

            resolve(block);
        });
    }

    _isSigValid( message, address, signature) {
        try {
            return bitcoinMessage.verify(message, address, signature);
        } catch {
            return false;
        }
    }

    _isSubmissionMessageExpired(message) {
        let messageTimeStamp = parseInt(message.split(':')[1]);
        let currentTimeStamp = parseInt(new Date().getTime().toString().slice(0, -3));
        let fiveMinsSeconds = 5 * 60;
        let diff = currentTimeStamp - messageTimeStamp;
        return diff > fiveMinsSeconds
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
                    stars.push({
                        'owner': data['address'],
                        'star': data['star']
                    })
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
                // ignore genesis block
                if (block.height <= 0)
                    return;
                
                let isValid = await block.validate();
                    
                if (!isValid){
                    errorLog.push(`Block #${block.height} is not valid (Ex. Tampered)`);
                    return;
                }

                let prevBlock = await self.getBlockByHeight(block.height - 1);
                if (block.previousBlockHash != prevBlock.hash)
                    errorLog.push(`Block #${block.height} has invalid prev block hash`);

            });
            resolve(errorLog);
        });
    }

}

module.exports.Blockchain = Blockchain;   