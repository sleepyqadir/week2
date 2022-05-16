# zku-c3-week2-q1

#### Compiling Circits and Contracts

Note: *The project contains temp private key please do not use it for main-net transaction 0x6B579C36C59886E54283E200ff14b2D458cE5EEa*

Install the required node modules by running:
```shell
npm install
```

Compile the circom circuits by running:

```shell
npm run compile:circuits
```

Compile the contracts to build artifacts by running:

```shell
npm run compile:contracts
```

To test the merkleTree circuits and contracts by running:

```shell
npm run test
```

Deploy the Merkletree contract on Rinkeby by running: 

Note: *Deployment need the alchemy api key and seedphrase of the ethereum account kindly edit it in hardhat.config.js before running command*

``` shell
npm run deploy
```

currently contract is already deployed on the rinkeby test-net 
<link>https://rinkeby.etherscan.io/address/0x9d872703A26A4d41FecAd3aaCCfA786A45613dC7 </link>

Import the generated below mentioned files to use in the frontend by running:

``` shell
npm run import:zkeys
```

- circuit_final.zkey | prover key
- circuit.wasm | wasm file to generate proof in browser
- witness_calculator.js
- verfication_key.json

### Running Frontend in Browser

Move to the web folder by running command:

``` shell
cd web
```

Run the static server to serve the zkeys on the localhost:8000 by running:

``` Shell
npm run serve-static
```

In another terminal run the below command to start frontend on localhost:1234

``` Shell
npm run start
```

- The Application will take some time to load the MerkleTree node

- Select the leaf you want to proof and paste in the leaf input field
- Enter Three path elements that are needed to generate the valid root of merkleTree
- Enter the path index's of the path elements. 0 for left and 1 for right
- Hit generate proof to generate the proof and to verify it

![Screenshot from 2022-05-16 20-14-18](https://user-images.githubusercontent.com/38910854/168626005-3c3ca9ee-1a4e-47dc-93d0-2513b746bb99.png)
