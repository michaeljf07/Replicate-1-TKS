import * as crypto from "crypto"; // Import the built-in crypto module for cryptographic functions

// Class representing a transfer of funds between two walletimestamp
class Transaction {
    constructor(
        public amount: number, // Amount of money to transfer
        public payer: string, // Public key of the payer (sender)
        public payee: string // Public key of the payee (receiver)
    ) {}

    // Convert the transaction details into a string (for easy logging/signing)
    toString() {
        return JSON.stringify(this);
    }
}

// Class representing an individual block on the blockchain
class Block {
    public nonce = Math.round(Math.random() * 999999999); // Random number used for mining (proof of work)

    constructor(
        public prevHash: string, // Hash of the previous block in the chain
        public transaction: Transaction, // The transaction data stored in this block
        public timestamp = Date.now() // Timestamp of when the block was created (default to current time)
    ) {}

    // Calculate the block's hash using SHA256 (which will be used to link it to other blocks)
    get hash() {
        const str = JSON.stringify(this); // Convert block data into a string
        const hash = crypto.createHash("SHA256"); // Create a new SHA256 hash object
        hash.update(str).end(); // Add the string to the hash and finalize it
        return hash.digest("hex"); // Return the hash as a hexadecimal string
    }
}

// Class representing the entire blockchain
class Chain {
    // Singleton pattern: ensure there's only one instance of the blockchain
    public static instance = new Chain();

    chain: Block[]; // Array to store the blocks in the chain

    constructor() {
        // Initialize the chain with a "genesis block" (the first block in the chain)
        this.chain = [
            new Block("", new Transaction(100, "genesis", "david")), // The genesis block has no previous hash
        ];
    }

    // Get the most recent block in the chain
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Proof of Work: A system to make sure adding a block requires computational effort (mining)
    mine(nonce: number) {
        let solution = 1; // Start searching for a solution
        console.log("⛏️  mining...");

        while (true) {
            const hash = crypto.createHash("MD5"); // Create a hash object using MD5 (for simplicity)
            hash.update((nonce + solution).toString()).end(); // Update the hash with a combination of the nonce and solution
            const attempt = hash.digest("hex"); // Get the hash result as a hexadecimal string

            // Check if the first four characters of the hash are '0000' (difficulty level)
            if (attempt.substr(0, 4) === "0000") {
                console.log(`Solved: ${solution}`); // If solved, print the solution
                return solution; // Return the solution to be used in the block
            }

            solution += 1; // Increment the solution and try again
        }
    }

    // Add a new block to the chain after verifying the signature and completing the proof of work
    addBlock(
        transaction: Transaction,
        senderPublicKey: string,
        signature: Buffer
    ) {
        // Verify the transaction's signature using the sender's public key
        const verify = crypto.createVerify("SHA256");
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature); // Check if the signature is valid

        if (isValid) {
            // If the signature is valid:
            const newBlock = new Block(this.lastBlock.hash, transaction); // Create a new block with the transaction
            this.mine(newBlock.nonce); // Mine the new block (perform proof of work)
            this.chain.push(newBlock); // Add the newly mined block to the chain
        }
    }
}

// Class representing a user's wallet, which has a public/private keypair
class Wallet {
    public publicKey: string; // Public key used to receive funds
    public privateKey: string; // Private key used to sign transactions

    constructor() {
        // Generate a new RSA public/private keypair
        const keypair = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048, // Key size: 2048 bitimestamp
            publicKeyEncoding: { type: "spki", format: "pem" }, // Encode public key in PEM format
            privateKeyEncoding: { type: "pkcs8", format: "pem" }, // Encode private key in PEM format
        });

        this.privateKey = keypair.privateKey; // Assign the generated private key to the wallet
        this.publicKey = keypair.publicKey; // Assign the generated public key to the wallet
    }

    // Send money from this wallet to another wallet
    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(
            amount,
            this.publicKey,
            payeePublicKey
        ); // Create a new transaction

        const sign = crypto.createSign("SHA256"); // Create a new signature object using SHA256
        sign.update(transaction.toString()).end(); // Sign the transaction

        const signature = sign.sign(this.privateKey); // Create a signature using the private key
        Chain.instance.addBlock(transaction, this.publicKey, signature); // Add the block to the chain
    }
}

// Example usage of the blockchain system

const david = new Wallet(); // Create a new wallet for david
const bob = new Wallet(); // Create a new wallet for Bob
const alice = new Wallet(); // Create a new wallet for Alice

david.sendMoney(50, bob.publicKey); // david sends 50 unitimestamp to Bob
bob.sendMoney(23, alice.publicKey); // Bob sends 23 unitimestamp to Alice
alice.sendMoney(5, bob.publicKey); // Alice sends 5 unitimestamp back to Bob

console.log(Chain.instance); // Print the current state of the blockchain
