export const getBalanceText = (balance: number, numDecimals: number) => {
	return balance > 1000000000
		? `${(balance / 1000000000).toFixed(2)}B`
		: balance > 1000000
		? `${(balance / 1000000).toFixed(2)}M`
		: numDecimals > 0
		? balance.toFixed(2)
		: balance.toString();
};
