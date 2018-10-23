const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should execute a small auction correctly using depositAndBuy() and depositAndSell()", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        let originalAccountBalance = await token.balanceOf.call(accounts[0]);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await token.approve(auction.address, 10000);
        await auction.depositAndBuy(token.address, 10000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await auction.depositAndBuy(token.address, 20000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await auction.depositAndBuy(token.address, 30000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await auction.depositAndSell(token.address, 10000000000000000000, 3, 3);
        await auction.depositAndSell(token.address, 20000000000000000000, 3, 3);
        await auction.depositAndSell(token.address, 30000000000000000000, 3, 3);

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 3, 3);
        await auction.checkVolume(token.address, "10000000000000000000", "10000000000000000000", 100, 0); // wrong price suggestion
        await auction.checkVolume(token.address, "20000000000000000000", "20000000000000000000", 100, 0); // correct price suggestion
        await auction.checkVolume(token.address, "30000000000000000000", "30000000000000000000", 100, 0); // wrong price suggestion
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let price = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, 0);

        accountBalance = await token.balanceOf.call(accounts[0]);
        assert(accountBalance.equals(originalAccountBalance));
        assert(maxVolume.equals(6));
        assert(price.equals("20000000000000000000"));
    });
    it("should execute a small auction correctly using depositAndBuy() and approveAndCall()", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        let originalAccountBalance = await token.balanceOf.call(accounts[0]);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.depositAndBuy(token.address, 10000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await auction.depositAndBuy(token.address, 20000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await auction.depositAndBuy(token.address, 30000000000000000000, 3, {value: 100000000, from: accounts[0]});
        await token.approveAndCall(auction.address, 3, "0x0000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000000003");
        await token.approveAndCall(auction.address, 3, "0x000000000000000000000000000000000000000000000001158e460913d000000000000000000000000000000000000000000000000000000000000000000003");
        await token.approveAndCall(auction.address, 3, "0x000000000000000000000000000000000000000000000001a055690d9db800000000000000000000000000000000000000000000000000000000000000000003");

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 3, 3);
        await auction.checkVolume(token.address, "10000000000000000000", "10000000000000000000", 100, 0); // wrong price suggestion
        await auction.checkVolume(token.address, "20000000000000000000", "20000000000000000000", 100, 0); // correct price suggestion
        await auction.checkVolume(token.address, "30000000000000000000", "30000000000000000000", 100, 0); // wrong price suggestion
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let price = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, 0);

        accountBalance = await token.balanceOf.call(accounts[0]);
        assert(accountBalance.equals(originalAccountBalance));
        assert(maxVolume.equals(6));
        assert(price.equals("20000000000000000000"));
    });
})
