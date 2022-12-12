//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

error RandomIpfsNft__needMoreETH();
error RandomIpfsNft__RangeOutOfBounds();

contract RandomIpfsNft is ERC721URIStorage, VRFConsumerBaseV2 {
    enum Pokemon {
        CHARMANDER,
        CHARIZARD,
        PIKACHU
    }

    string[] internal s_pokemonToken;
    uint256 private s_tokenCounter;
    uint256 private immutable i_mintFee;
    uint256 private constant MAX_CHANCE_VALUE = 100;
    mapping(uint256 => address) private s_requestIdToSender;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subId;
    uint16 private constant MIN_CONFIRMATION = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUMWORDS = 1;

    event NFTRequested(uint256 indexed requestId, address indexed requester);
    event NFTMinted(Pokemon indexed pokemon, address indexed minter);

    constructor(
        address vrfCoordinatorV2,
        uint256 mintFee,
        bytes32 keyHash,
        uint64 subId,
        uint32 callbackGasLimit,
        string[] memory pokemonTokenUris
    ) ERC721("Pokemon", "MONSTER") VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_keyHash = keyHash;
        i_subId = subId;
        i_mintFee = mintFee;
        i_callbackGasLimit = callbackGasLimit;
        s_pokemonToken = pokemonTokenUris;
        s_tokenCounter = 0;
    }

    function mintNft() public payable {
        if (msg.value < i_mintFee) revert RandomIpfsNft__needMoreETH();
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subId,
            MIN_CONFIRMATION,
            i_callbackGasLimit,
            NUMWORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NFTRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        s_tokenCounter++;
        address dogOwner = s_requestIdToSender[requestId];
        uint256 modedRandomWord = randomWords[0] % MAX_CHANCE_VALUE;
        Pokemon mintedPokemon = getPokemon(modedRandomWord);
        _safeMint(dogOwner, s_tokenCounter);
        _setTokenURI(s_tokenCounter, s_pokemonToken[uint256(mintedPokemon)]);
        emit NFTMinted(mintedPokemon, dogOwner);
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 40, MAX_CHANCE_VALUE];
    }

    function getPokemon(
        uint256 modedRandomword
    ) private pure returns (Pokemon) {
        uint256 cumilativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint i = 0; i < 3; i++) {
            if (
                modedRandomword < chanceArray[i] &&
                modedRandomword > cumilativeSum
            ) return Pokemon(i);
            cumilativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function getKeyHash() public view returns (bytes32) {
        return i_keyHash;
    }

    function getCallBackGasLimit() public view returns (uint32) {
        return i_callbackGasLimit;
    }

    function getPokemonURI(uint256 index) public view returns (string memory) {
        return s_pokemonToken[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }
}
