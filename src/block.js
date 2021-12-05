/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform, 
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods 
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument data will be the object containing the transaction data
	constructor(data){
		this.hash = null;                                           // Hash of the block
		this.height = 0;                                            // Block Height (consecutive number of each block)
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');   // Will contain the transactions stored in the block, by default it will encode the data
		this.time = 0;                                              // Timestamp for the Block creation
		this.previousBlockHash = null;                              // Reference to the previous Block Hash
    }
    
   
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            // Save in auxiliary variable the current block hash
            let currentHash = self.hash;
            self.hash = null;
            let hash = SHA256(JSON.stringify(self)).toString();
            self.hash = currentHash;
            resolve(hash == currentHash);
        });
    }

    getBData() {
        if (this.height <= 0)
            return
        
        // Getting the encoded data saved in the Block
        let data = this.body;
        // Decoding the data to retrieve the JSON representation of the object
        let decodedData = hex2ascii(data);
        // Parse the data to an object to be retrieve.
        let parsedData = JSON.parse(decodedData);
        // Resolve with the data if the object isn't the Genesis block
        return parsedData;
    }

}

module.exports.Block = Block;                    // Exposing the Block class as a module