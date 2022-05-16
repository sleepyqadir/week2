//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PoseidonT3 } from "./Poseidon.sol"; //an existing library to perform Poseidon hash on solidity
import "./verifier.sol"; //inherits with the MerkleTreeInclusionProof verifier contract

contract MerkleTree is Verifier {
   uint256[] public hashes; // the Merkle tree in flattened array form
    uint256 public index = 0; // the current index of the first unfilled leaf
    uint256 public root; // the current Merkle root
    uint256 treeLevels = 3;
    uint256 noOfleaves = 0;

    constructor() {
        // [assignment] initialize a Merkle tree of 8 with blank leaves

        for (uint256 i = 0; i < 8; i++) {
            hashes.push(hashLeftRight(0,0));
            noOfleaves++;
        }

        uint256 n=hashes.length;
        uint256 offset = 0;

        while(n>0) {
            for (uint256 i = 0; i < n-1; i+=2){
                hashes.push(hashLeftRight(hashes[i+offset],hashes[i+offset+1]));

            }
            offset += n;
            n=n/2;
        }
        root = hashes[hashes.length-1];
    }
    
    function hashLeftRight(uint256 _left, uint256 _right)
        public
        pure
        returns (uint256)
    {
        uint256[2] memory input;
        input[0] = _left;
        input[1] = _right;
        return PoseidonT3.poseidon(input);
    }

    function insertLeaf(uint256 hashedLeaf) public returns (uint256) {
        // [assignment] insert a hashed leaf into the Merkle tree
        hashes[index] = hashedLeaf;
        uint offset = index;
        uint indexor = index;
        for (uint256 i = 0; i < treeLevels; i++) {
            if(indexor % 2 == 0) {
                offset = offset/2 + noOfleaves;
                hashes[offset] = hashLeftRight(hashes[indexor],hashes[indexor+1]);
                indexor = offset;
            }
            else {
                offset = (offset-1)/2 + noOfleaves;
                hashes[offset] = hashLeftRight(hashes[indexor-1],hashes[indexor]);
                indexor = offset;
            }
        }
        index++;
        root = hashes[hashes.length - 1];
        return hashes[hashes.length-1];
    }

    function verify(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input
        ) public view returns (bool) {

        // [assignment] verify an inclusion proof and check that the proof root matches current root
        require(input[0] == root,"invalid proof for the root");
        return verifyProof(a,b,c,input);
    }

}
