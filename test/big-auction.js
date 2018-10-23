const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should execute a big auction correctly", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.deposit({value: 100000000, from: accounts[0]});
        await token.approve(auction.address, 10000);
        await auction.depositToken(token.address, 10000);

        for (var i = 1; i <= 43; i++) {
            price = i.toString() + "0000000000000000000"; amount = 3;
            await auction.buy(token.address, price, amount);
        }

        for (var i = 1; i <= 43; i++) {
            price = i.toString() + "0000000000000000000"; amount = 3;
            await auction.sell(token.address, price, amount);
        }

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 43, 43);
        await auction.checkVolume(token.address, "210000000000000000000", "210000000000000000000", 100, 0); // wrong price suggestion
        await auction.checkVolume(token.address, "220000000000000000000", "220000000000000000000", 100, 0); // correct price suggestion
        await auction.checkVolume(token.address, "230000000000000000000", "230000000000000000000", 100, 0); // wrong price suggestion
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let auctionPrice = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, 0);

        assert(maxVolume.equals(22*3));
        assert(auctionPrice.equals("220000000000000000000"));
    });
})
