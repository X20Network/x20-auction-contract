const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should execute a small auction correctly", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.deposit({value: 100000000, from: accounts[0]});
        await token.approve(auction.address, 10000);
        await auction.depositToken(token.address, 10000);

        await auction.buy(token.address, "10000000000000000000", 3);
        await auction.buy(token.address, "20000000000000000000", 3);
        await auction.buy(token.address, "30000000000000000000", 3);
        await auction.sell(token.address, "10000000000000000000", 3);
        await auction.sell(token.address, "20000000000000000000", 3);
        await auction.sell(token.address, "30000000000000000000", 3);

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 3, 3);
        await auction.checkVolume(token.address, "10000000000000000000", "10000000000000000000", 100, 0); // wrong price suggestion
        await auction.checkVolume(token.address, "20000000000000000000", "20000000000000000000", 100, 0); // correct price suggestion
        await auction.checkVolume(token.address, "30000000000000000000", "30000000000000000000", 100, 0); // wrong price suggestion
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let price = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, 0);

        await auction.withdrawToken(token.address, 1000);
        assert(maxVolume.equals(6));
        assert(price.equals("20000000000000000000"));
    });
})
