## Z-Pay Backend Test Case

**Note: The overall architecture vision is necessary.
Following that a partial implementation is required.**

### Architecture overview
* Transactions input via HTTP API or direct MongoDB collection inserts
* Pending transactions are being assigned to a first available worker
* Worker validates transaction integrity and if ok, applies it to account balance(s).
* Otherwise transaction is marked as errored/invalid with error/validation log attached for later review.
### Other features
* Horizontal scalability by simply adding more workers
* Multiple balances per account (to support multiple currencies)
* Very short dependencies list

Using any libraries/databases etc create a simple account-based
payment service with REST API.

Libs/DBs used in this solution:
- [MongoDB](https://mongodb.com) ([Mongoose](https://mongoosejs.com)) for DB
- [Express](https://expressjs.com) for HTTP
- [NATS](https://nats.io) ([ts-nats](https://github.com/nats-io/nats.ts)) for message queue

This service will have basic endpoints:

**Note: the amount field type is changed to `String` so that it could fully
contain the MongoDB's `Decimal128` type.**

1. Account Topup
```
/topup {
	"account_id": "",
	"amount": "123",
}
```
2. Account Withdraw
```
/withdraw {
	"account_id": "",
	"amount": "123"
}
```
3. Transfer between account A and account B
```
/transfer {
	"from_id": "",
	"to_id": "",
	"amount": "123"
}
```

The goal is to create a racing-condition-proof system that would
prevent account being overdrafted by design.



## Stage 1
Using nodejs, bitcoind, electrumx implement 5 functions specified below.
- [electrumx](https://github.com/kyuupichan/electrumx)
- [bitcoind](https://github.com/bitcoin/bitcoin)


#### async send( amount:float, address:string, fee:number ) -> txId:string
#### DONE
- amount - amount of funds
- address - where funds are beign sent to
- fee - satoshi per byte
- txId - id of the created transaction on the network

#### async feeRegular() -> fee:number
#### DONE
- fee - regular fee/byte for transaction

#### async feePriority() -> fee:number
#### DONE
- fee - priority fee/byte for transaction

#### async createAlias() -> address:string
#### DONE
- address - Bitcoin address of the created alias

#### async balance() -> balance:float

## Stage 2

Implement the callback function that would be called every time wallet receives a transaction or transaction receives confirmation up to config.MAX_CONFIRMATIONS

#### async callbackReceivedTransaction( txId:string, addressTo:string, amount:float, confirmations:number )
#### DONE
- txId - Id of the received transaction
- addressTo - Address of the receiver
- amount - Amount of the received transaction
- confirmations - Number of confirmations on the network

The callback function doesn't need to do anything.

## Stage 3

Describe the process of wallet creation and how to receive its xpub token.