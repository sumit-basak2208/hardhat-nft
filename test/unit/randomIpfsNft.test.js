const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");


!developmentChains.includes(network.name) ? describe.skip : describe("Random IPFS NFT", () => {

    let deployer, randomIpfsNft, vrfCoordinatorV2Mock, chainId, tokenUris, mintFee
    beforeEach(async() => {
        const accounts = await ethers.getSigners()
        deployer = await accounts[0]
        await deployments.fixture(["randomIpfs", "mocks"])
        randomIpfsNft = await ethers.getContract("RandomIpfsNft")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        chainId = network.config.chainId
        mintFee = await randomIpfsNft.getMintFee()
        tokenUris = ["QmVVx5Z9tCy9f4wVnSF5LHMe9hLoaztq7gJLMWXFZcCz6X", "QmVwfgv2RsFcaozcuvFetvxV4YU1aqmQCZcbgMmQRjHp2U", "QmXdzWV9adKYnG2DTwKEKSgsjTLVaNprD4K5yc8DhKpRSE"]
    })

    describe("Constructor", () => {
        it("Sets Value Correctly", async() => {
            const keyHash = await randomIpfsNft.getKeyHash()
            assert.equal(keyHash.toString(), networkConfig[chainId].keyHash)
            const callBackGasLimit = await randomIpfsNft.getCallBackGasLimit()
            assert.equal(callBackGasLimit.toString(), networkConfig[chainId].callBackGasLimit)
            const tokenCounter = await randomIpfsNft.getTokenCounter()
            assert.equal(tokenCounter.toString(), "0")
            for(i=0; i<3; i++) {
                const tokenUri = await randomIpfsNft.getPokemonURI(i)
                assert.equal(tokenUri.toString(), tokenUris[i])
            }
        })
    })

    describe("mintNft", () => {

        it("Reverts if Not Enough ETH is given", async() => {
            await expect(randomIpfsNft.mintNft({value: ethers.utils.parseEther("0.002")})).to.be.revertedWith("RandomIpfsNft__needMoreETH")
        })

        it("Reverts if No ETH is given", async() => {
            await expect(randomIpfsNft.mintNft({value: ethers.utils.parseEther("0.002")})).to.be.revertedWith("RandomIpfsNft__needMoreETH")
        })

        it("Emits an Event", async() => {
            await expect(randomIpfsNft.mintNft({value: mintFee.toString()})).to.emit("NFTRequested")
        })
    })

    describe("fulfillRandomWords", async() => {

        it("Mints NFT after getting random Word", async() => {
            new Promise(async(resolve, reject) => {
                randomIpfsNft.once("NFTMinted", async() => {
                    try{
                        const tokenCounter = await randomIpfsNft.getTokenCounter()
                        const tokenUri = await randomIpfsNft.tokenURI(tokenCounter.toString())
                        assert.equal(tokenUris.includes(tokenUri.toString()), true)
                        assert.equal(tokenUri.toString().includes("ipfs://"), true)
                        assert.equal(tokenCounter.toString(), "1")
                        resolve()
                    } catch(err) {
                        console.log(err)
                        reject()
                    }
                })
            })
            const txRec = await randomIpfsNft.mintNft({value: mintFee.toString()})
            const txRes = await txRec.wait(1)
            const requestId = txRes.events[1].args.requestId
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
        })
    })
})