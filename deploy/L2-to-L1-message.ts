// The following script sends a message from L2 to L1, retrieves the message proof, and validates that the message received in L1 came from an L2 block.
import * as ethers from "ethers";
import { Provider, utils, Wallet } from "zksync-web3";
import * as ContractArtifact from "../artifacts-zk/@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IL1Messenger.sol/IL1Messenger.json";

const TEST_PRIVATE_KEY = "0a6bbab2d0fb0d7b049ae0d8de395f4cfe9c3783ad302c56f21676fcc34f4fbe";

const MESSAGE = "Some L2->L1 message";

const l2Provider = new Provider("https://testnet.era.zksync.dev");
const l1Provider = ethers.getDefaultProvider("goerli");
//artifacts-zk/@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IL1Messenger.sol/IL1Messenger.json


const wallet = new Wallet(TEST_PRIVATE_KEY, l2Provider, l1Provider);

async function sendMessageToL1(text: string) {
  console.log(`Sending message to L1 with text ${text}`);
  const textBytes = ethers.utils.toUtf8Bytes(MESSAGE);

  const messengerContract = new ethers.Contract(utils.L1_MESSENGER_ADDRESS,  ContractArtifact.abi, wallet);
  console.log("messengerContract",messengerContract);
  const tx = await messengerContract.sendToL1(textBytes);
  await tx.wait();
  console.log("L2 trx hash is ", tx.hash);
  return tx;
}

async function getL2MessageProof(blockNumber: ethers.BigNumberish) {
  console.log(`Getting L2 message proof for block ${blockNumber}`);
  return await l2Provider.getMessageProof(blockNumber, wallet.address, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(MESSAGE)));
}

async function proveL2MessageInclusion(l1BatchNumber: ethers.BigNumberish, proof: any, trxIndex: number) {
  const zkAddress = await l2Provider.getMainContractAddress();

  const mailboxL1Contract = new ethers.Contract(zkAddress, utils.ZKSYNC_MAIN_ABI, l1Provider);
  // all the information of the message sent from L2
  const messageInfo = {
    txNumberInBlock: trxIndex,
    sender: wallet.address,
    data: ethers.utils.toUtf8Bytes(MESSAGE),
  };

  console.log(`Retrieving proof for batch ${l1BatchNumber}, transaction index ${trxIndex} and proof id ${proof.id}`);

  const res = await mailboxL1Contract.proveL2MessageInclusion(l1BatchNumber, proof.id, messageInfo, proof.proof);

  return res;
}

/**
 * Full end-to-end of an L2-L1 messaging with proof validation.
 * Recommended to run in 3 steps:
 * 1. Send message.
 * 2. Wait for transaction to finalize and block verified
 * 3. Wait for block to be verified and validate proof
 */
async function main() {
  // Step 1: send message
  const l2Trx = await sendMessageToL1(MESSAGE);

  console.log("Waiting for transaction to finalize...");

  // Step 2: waiting to finalize can take a few minutes.
  const l2Receipt = await l2Trx.waitFinalize();

  // Step 3: get and validate proof (block must be verified)
  const proof = await getL2MessageProof(l2Receipt.blockNumber);

  console.log(`Proof is: `, proof);

  const { l1BatchNumber, l1BatchTxIndex } = await l2Provider.getTransactionReceipt(l2Receipt.transactionHash);

  console.log("L1 Index for Tx in block :>> ", l1BatchTxIndex);

  console.log("L1 Batch for block :>> ", l1BatchNumber);

  // IMPORTANT: This method requires that the block is verified
  // and sent to L1!
  const result = await proveL2MessageInclusion(
    l1BatchNumber,
    proof,
    // @ts-ignore
    l1BatchTxIndex
  );

  console.log("Result is :>> ", result);
  process.exit();
}

try {
  main();
} catch (error) {
  console.error(error);
}
