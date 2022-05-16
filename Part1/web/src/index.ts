import { ethers } from 'ethers';
import builder from './witness_calculator';
import { groth16 } from 'snarkjs';
const zkeyPath = 'http://127.0.0.1:8000/circuit_final.zkey';
const wasmPath = 'http://127.0.0.1:8000/circuit.wasm';
const vkPath = 'http://127.0.0.1:8000/verification_key.json';

const merkletree = [];

const url =
  'https://eth-rinkeby.alchemyapi.io/v2/VmxWigXMpDjAERj9JssUE_MNmC_NnbMX';
const customHttpProvider = new ethers.providers.JsonRpcProvider(url);
const json = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_left',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_right',
        type: 'uint256',
      },
    ],
    name: 'hashLeftRight',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'hashes',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'index',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'hashedLeaf',
        type: 'uint256',
      },
    ],
    name: 'insertLeaf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'root',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[2]',
        name: 'a',
        type: 'uint256[2]',
      },
      {
        internalType: 'uint256[2][2]',
        name: 'b',
        type: 'uint256[2][2]',
      },
      {
        internalType: 'uint256[2]',
        name: 'c',
        type: 'uint256[2]',
      },
      {
        internalType: 'uint256[1]',
        name: 'input',
        type: 'uint256[1]',
      },
    ],
    name: 'verify',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[2]',
        name: 'a',
        type: 'uint256[2]',
      },
      {
        internalType: 'uint256[2][2]',
        name: 'b',
        type: 'uint256[2][2]',
      },
      {
        internalType: 'uint256[2]',
        name: 'c',
        type: 'uint256[2]',
      },
      {
        internalType: 'uint256[1]',
        name: 'input',
        type: 'uint256[1]',
      },
    ],
    name: 'verifyProof',
    outputs: [
      {
        internalType: 'bool',
        name: 'r',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const signer = new ethers.Wallet(
  '13a707960952402c26fe2fd464ff7e1e2d112338b616048b0a0619327156ee9c',
  customHttpProvider
);

const MerkleTreeFactory = new ethers.Contract(
  '0x9d872703A26A4d41FecAd3aaCCfA786A45613dC7',
  json,
  customHttpProvider
);

const calculateProof = async (
  leaf,
  path_element1,
  path_element3,
  path_element2,
  path_index1,
  path_index2,
  path_index3
) => {
  // Fetch the zkey and wasm files, and convert them into array buffers
  let resp = await fetch(wasmPath);
  const wasmBuff = await resp.arrayBuffer();
  resp = await fetch(zkeyPath);
  const zkeyBuff = await resp.arrayBuffer();
  const circuitInputs = {
    leaf: BigInt(leaf),
    path_elements: [
      BigInt(path_element1),
      BigInt(path_element2),
      BigInt(path_element2),
    ],
    path_index: [BigInt(path_index1), BigInt(path_index2), BigInt(path_index3)],
  };

  console.log({ circuitInputs });
  console.log({ builder });
  const witnessCalculator = await builder(wasmBuff);
  const wtnsBuff = await witnessCalculator.calculateWTNSBin(circuitInputs, 0);
  const start = Date.now();
  const { proof, publicSignals } = await groth16.prove(
    new Uint8Array(zkeyBuff),
    wtnsBuff,
    null
  );
  const end = Date.now();
  const timeTaken = ((end - start) / 1000).toString() + ' seconds';
  const timeComponent = document.getElementById('time');
  timeComponent.innerHTML = timeTaken;
  const proofForTx = [
    proof.pi_a[0],
    proof.pi_a[1],
    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],
    proof.pi_c[0],
    proof.pi_c[1],
  ];
  const proofAsStr = JSON.stringify(
    proofForTx.map((x) => BigInt(x).toString(10))
  )
    .split('\n')
    .join()
    .replaceAll('"', '');
  const proofCompnent = document.getElementById('proof');
  proofCompnent.innerHTML = proofAsStr;
  // Verify the proof
  resp = await fetch(vkPath);
  const vkey = await resp.json();
  const res = await groth16.verify(vkey, publicSignals, proof);
  const resultComponent = document.getElementById('result');
  resultComponent.innerHTML = res;
};

const getContractData = async () => {
  for (let index = 0; index < 15; index++) {
    const node = (await MerkleTreeFactory.hashes(index)).toString();
    merkletree.push(node);
    document.getElementsByClassName(
      `id${index + 1}`
    )[0].innerText = ` [${index}] --> ${node}`;
  }
};

const main = async () => {
  getContractData();
  const bGenProof = document.getElementById('bGenProof');

  bGenProof.addEventListener('click', () => {
    const leaf = document.getElementById('leaf').value;
    const path_element1 = document.getElementById('path_element1').value;
    const path_element2 = document.getElementById('path_element2').value;
    const path_element3 = document.getElementById('path_element3').value;
    const path_index1 = document.getElementById('path_index1').value;
    const path_index2 = document.getElementById('path_index2').value;
    const path_index3 = document.getElementById('path_index3').value;
    calculateProof(
      leaf,
      path_element1,
      path_element3,
      path_element2,
      path_index1,
      path_index2,
      path_index3
    );
  });
};

main();
