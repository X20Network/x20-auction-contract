const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should allow withdraw() when checkVolume() was missed", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        let originalAccountBalance = web3.eth.getBalance(accounts[0]);
        await auction.startAuction(token.address, 1546300800, 600, 600, {gasPrice: 0});

        await auction.deposit({value: 100000000, from: accounts[0], gasPrice: 0});
        await token.approve(auction.address, 10000, {gasPrice: 0});
        await auction.depositToken(token.address, 10000, {gasPrice: 0});

        await auction.buy(token.address, "10000000000000000000", 3, {gasPrice: 0});
        await auction.buy(token.address, "20000000000000000000", 3, {gasPrice: 0});
        await auction.buy(token.address, "30000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "10000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "20000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "30000000000000000000", 3, {gasPrice: 0});

        await auction.startReveal(token.address, {gasPrice: 0});
        await auction.revealPublicOrdersCount(token.address, 3, 3, {gasPrice: 0});
        // No Check
        await auction.executeAuction(token.address, 100, 0, {gasPrice: 0});

        await auction.withdraw(100000000, {gasPrice: 0});
        accountBalance = web3.eth.getBalance(accounts[0]);
        assert(accountBalance.equals(originalAccountBalance));
    });
    it("should allow withdrawToken() when checkVolume() was missed", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        let originalAccountBalance = await token.balanceOf.call(accounts[0]);
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
        // No Check
        await auction.executeAuction(token.address, 100, 0);

        await auction.withdrawToken(token.address, 10000);
        accountBalance = await token.balanceOf.call(accounts[0]);
        assert(accountBalance.equals(originalAccountBalance));
    });
    it("should still execute and allow withdrawals if startReveal() was missed", async () => {
        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        let originalAccountBalance = web3.eth.getBalance(accounts[0]);
        let originalAccountTokenBalance = await token.balanceOf.call(accounts[0]);
        await auction.startAuction(token.address, 1546300800, 600, 600, {gasPrice: 0});

        await auction.deposit({value: 100000000, from: accounts[0], gasPrice: 0});
        await token.approve(auction.address, 10000, {gasPrice: 0});
        await auction.depositToken(token.address, 10000, {gasPrice: 0});

        await auction.buy(token.address, "10000000000000000000", 3, {gasPrice: 0});
        await auction.buy(token.address, "20000000000000000000", 3, {gasPrice: 0});
        await auction.buy(token.address, "30000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "10000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "20000000000000000000", 3, {gasPrice: 0});
        await auction.sell(token.address, "30000000000000000000", 3, {gasPrice: 0});

        // No Reveal
        // No Check
        await auction.executeAuction(token.address, 100, 0, {gasPrice: 0});

        await auction.withdraw(100000000, {gasPrice: 0});
        await auction.withdrawToken(token.address, 10000, {gasPrice: 0});
        let accountBalance = web3.eth.getBalance(accounts[0]);
        let accountTokenBalance = await token.balanceOf.call(accounts[0]);
        assert(accountBalance.equals(originalAccountBalance));
        assert(accountTokenBalance.equals(originalAccountTokenBalance));
    });
})
