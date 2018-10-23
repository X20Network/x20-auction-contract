const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should execute a small auction with fees correctly", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.changeFees(["1000000000000000", "2000000000000000", "3000000000000000"]);
        await auction.changeFeeAccount(0);
        await auction.addToken(token.address, 0);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.deposit({value: "10000000000000000000", from: accounts[0]});
        await token.approve(auction.address, "1000000000000000000000");
        await auction.depositToken(token.address, "1000000000000000000000");

        await auction.buy(token.address, "10000000000000000", "30000000000000000000");
        await auction.buy(token.address, "20000000000000000", "30000000000000000000");
        await auction.buy(token.address, "30000000000000000", "30000000000000000000");
        await auction.sell(token.address, "10000000000000000", "30000000000000000000");
        await auction.sell(token.address, "20000000000000000", "30000000000000000000");
        await auction.sell(token.address, "30000000000000000", "30000000000000000000");

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 3, 3);
        await auction.checkVolume(token.address, "20000000000000000", "20000000000000000", 100, 0);
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let price = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, 0);

        let tokenBalance = await auction.balances.call(token.address, accounts[0]);
        let ethereumBalance = await auction.balances.call(0, accounts[0]);
        let ethereumBalanceFees = await auction.balances.call(0, 0);
        assert(maxVolume.equals("60000000000000000000"));
        assert(price.equals("20000000000000000"));
        assert(tokenBalance.equals("1000000000000000000000"));
        assert(ethereumBalanceFees.equals("2400000000000000"));
        assert(ethereumBalance.plus(ethereumBalanceFees).equals("10000000000000000000"));
    });
})
