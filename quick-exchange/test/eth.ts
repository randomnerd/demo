import { providers, utils, Wallet } from 'ethers';

export async function sendEth(
    privkey: string,
    to: string,
    amount: number,
    // network: string = 'rinkeby',
) {
    // Temporarily switched to devchain
    // const provider = getDefaultProvider(network);
    const provider = new providers.JsonRpcProvider('http://10.8.0.15:52259');
    const wallet = new Wallet(privkey, provider);
    const tx = { to, value: utils.parseEther(String(amount)) };
    return await wallet.sendTransaction(tx);
}
