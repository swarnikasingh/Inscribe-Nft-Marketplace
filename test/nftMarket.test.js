/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */

const NftMarket = artifacts.require("NftMarket");
const { ethers } = require("ethers");

contract("NftMarket", accounts => {
  let _contract = null;
  let _nftPrice = ethers.utils.parseEther("0.3").toString();  // NFT price (0.3 ether)
  let _listingPrice = ethers.utils.parseEther("0.025").toString();  // Listing price (0.025 ether)
  let royaltyPercentage = 10; // Fixed royalty percentage (10%)

  before(async () => {
    _contract = await NftMarket.deployed();
  });

  describe("Mint token", () => {
    const tokenURI = "https://test.com";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice,  {
        from: accounts[0],
        value: _listingPrice
      })
    })

    it("owner of the first token should be address[0]", async () => {
      const owner = await _contract.ownerOf(1);
      assert.equal(owner, accounts[0], "Owner of token is not matching address[0]");
    })

    it("first token should point to the correct tokenURI", async () => {
      const actualTokenURI = await _contract.tokenURI(1);

      assert.equal(actualTokenURI, tokenURI, "tokenURI is not correctly set");
    })

    it("should not be possible to create a NFT with used tokenURI", async () => {
      try {
        await _contract.mintToken(tokenURI, _nftPrice, {
          from: accounts[0]
        })
      } catch(error) {
        assert(error, "NFT was minted with previously used tokenURI");
      }
    })

    it("should have one listed item", async () => {
      const listedItemCount = await _contract.listedItemsCount();
      assert.equal(listedItemCount.toNumber(), 1, "Listed items count is not 1");
    })

    it("should have create NFT item", async () => {
      const nftItem = await _contract.getNftItem(1);

      assert.equal(nftItem.tokenId, 1, "Token id is not 1");
      assert.equal(nftItem.price, _nftPrice, "Nft price is not correct");
      assert.equal(nftItem.creator, accounts[0], "Creator is not account[0]");
      assert.equal(nftItem.isListed, true, "Token is not listed");
    })
  })

  describe("Buy NFT", () => {
    before(async () => {
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice
      })
    })

    it("should unlist the item", async () => {
      const listedItem = await _contract.getNftItem(1);
      assert.equal(listedItem.isListed, false, "Item is still listed");
    })

    it("should decrease listed items count", async () => {
      const listedItemsCount = await _contract.listedItemsCount();
      assert.equal(listedItemsCount.toNumber(), 0, "Count has not been decremented");
    })

    it("should change the owner", async () => {
      const currentOwner = await _contract.ownerOf(1);
      assert.equal(currentOwner, accounts[1], "Item is still listed");
    })
  })

  describe("Token transfers", () => {
    const tokenURI = "https://test-json-2.com";
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice
      })
    })

    it("should have two NFTs created", async () => {
      const totalSupply = await _contract.totalSupply();
      assert.equal(totalSupply.toNumber(), 2, "Total supply of token is not correct");
    })

    it("should be able to retrieve nft by index", async () => {
      const nftId1 = await _contract.tokenByIndex(0);
      const nftId2 = await _contract.tokenByIndex(1);

      assert.equal(nftId1.toNumber(), 1, "Nft id is wrong");
      assert.equal(nftId2.toNumber(), 2, "Nft id is wrong");
    })

    it("should have one listed NFT", async () => {
      const allNfts = await _contract.getAllNftsOnSale();
      assert.equal(allNfts[0].tokenId, 2, "Nft has a wrong id");
    })

    it("account[1] should have one owned NFT", async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[1]});
      assert.equal(ownedNfts[0].tokenId, 1, "Nft has a wrong id");
    })

    it("account[0] should have one owned NFT", async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[0]});
      assert.equal(ownedNfts[0].tokenId, 2, "Nft has a wrong id");
    })
  })

  describe("Token transfer to new owner", () => {
    before(async () => {
      await _contract.transferFrom(
        accounts[0],
        accounts[1],
        2
      )
    })

    it("accounts[0] should own 0 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[0]});
      assert.equal(ownedNfts.length, 0, "Invalid length of tokens");
    })

    it("accounts[1] should own 2 tokens", async () => {
      const ownedNfts = await _contract.getOwnedNfts({from: accounts[1]});
      assert.equal(ownedNfts.length, 2, "Invalid length of tokens");
    })
  })

  describe("List an Nft", () => {
    before(async () => {
      await _contract.placeNftOnSale(
        1,
        _nftPrice, { from: accounts[1], value: _listingPrice}
      )
    })

    it("should have two listed items", async () => {
      const listedNfts = await _contract.getAllNftsOnSale();

      assert.equal(listedNfts.length, 2, "Invalid length of Nfts");
    })

    it("should set new listing price", async () => {
      await _contract
        .setListingPrice(_listingPrice, {from: accounts[0]});
      const listingPrice = await _contract.listingPrice();

      assert.equal(listingPrice.toString(), _listingPrice, "Invalid Price");
    })
  });

  // New Test: Royalty Payment Test
  describe("Royalty payment", () => {
    const tokenURI = "https://royalty-test.com";
    let initialCreatorBalance;
    let initialBuyerBalance;

    before(async () => {
      // Mint a new token with accounts[0] as the creator
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice
      });

      // Get the initial balance of accounts[0] (creator) and accounts[1] (buyer)
      initialCreatorBalance = await web3.eth.getBalance(accounts[0]);
      initialBuyerBalance = await web3.eth.getBalance(accounts[1]);

      // Accounts[1] buys the NFT
      await _contract.buyNft(1, {
        from: accounts[1],
        value: _nftPrice  // Buyer pays the full price
      });
    });

    it("should pay royalty to the creator on sale", async () => {
      // Calculate the expected royalty (10% of the NFT price)
      const expectedRoyalty = ethers.utils.parseEther("0.03").toString();  // 0.3 * 10%

      // Get the new balance of the creator after the sale
      const finalCreatorBalance = await web3.eth.getBalance(accounts[0]);

      // Calculate the actual amount of royalty received by the creator
      const royaltyReceived = web3.utils.toBN(finalCreatorBalance).sub(web3.utils.toBN(initialCreatorBalance)).toString();

      assert.equal(royaltyReceived, expectedRoyalty, "Royalty amount is not correct");
    });

    it("should transfer the remaining amount to the seller", async () => {
      // Calculate the amount the seller (accounts[0]) should receive after paying the royalty
      const expectedSellerAmount = ethers.utils.parseEther("0.27").toString();  // 0.3 - 0.03 (after royalty)

      // Get the balance after the sale for accounts[0] (seller)
      const finalSellerBalance = await web3.eth.getBalance(accounts[0]);

      // Check if the seller received the correct amount after royalty deduction
      const sellerReceived = web3.utils.toBN(finalSellerBalance).sub(web3.utils.toBN(initialCreatorBalance)).toString();

      assert.equal(sellerReceived, expectedSellerAmount, "The seller did not receive the correct amount after royalty deduction");
    });
  });
});
