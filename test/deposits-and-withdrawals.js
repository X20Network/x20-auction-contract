const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

contract('Auction', async (accounts) => {
    it("should deposit and withdraw Ether correctly", async () => {
        let amount = 100000000;

        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        let contractBalance = await auction.balances.call(0, accounts[0]);
        let originalAccountBalance = web3.eth.getBalance(accounts[0]);
        assert(contractBalance.equals(0));

        await auction.deposit({value: amount, from: accounts[0], gasPrice: 0});
        contractBalance = await auction.balances.call(0, accounts[0]);
        assert(contractBalance.equals(amount));

        await auction.withdraw(amount, {gasPrice: 0});
        contractBalance = await auction.balances.call(0, accounts[0]);
        accountBalance = web3.eth.getBalance(accounts[0]);
        assert.equal(contractBalance, 0);
        assert(accountBalance.equals(originalAccountBalance));
    });
    it("should deposit and withdraw tokens correctly", async () => {
        let amount = 1000;

        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        let contractBalance = await auction.balances.call(token.address, accounts[0]);
        let originalAccountBalance = await token.balanceOf.call(accounts[0]);
        assert(contractBalance.equals(0));

        await token.approve(auction.address, amount);
        await auction.depositToken(token.address, amount);
        contractBalance = await auction.balances.call(token.address, accounts[0]);
        assert(contractBalance.equals(amount));

        await auction.withdrawToken(token.address, amount);
        contractBalance = await auction.balances.call(token.address, accounts[0]);
        accountBalance = await token.balanceOf.call(accounts[0]);
        assert.equal(contractBalance, 0);
        assert(accountBalance.equals(originalAccountBalance));
    });
    it("should deposit and withdraw tokens correctly using approveAndCall()", async () => {
        let amount = 1000;

        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        let contractBalance = await auction.balances.call(token.address, accounts[0]);
        let originalAccountBalance = await token.balanceOf.call(accounts[0]);
        assert(contractBalance.equals(0));

        await token.approveAndCall(auction.address, amount, []);
        contractBalance = await auction.balances.call(token.address, accounts[0]);
        assert(contractBalance.equals(amount));

        await auction.withdrawToken(token.address, amount);
        contractBalance = await auction.balances.call(token.address, accounts[0]);
        accountBalance = await token.balanceOf.call(accounts[0]);
        assert.equal(contractBalance, 0);
        assert(accountBalance.equals(originalAccountBalance));
    });
})
