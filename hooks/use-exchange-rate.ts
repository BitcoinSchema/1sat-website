import { useEffect, useState } from "react";

const EXCHANGE_RATE_API =
	"https://api.whatsonchain.com/v1/bsv/main/exchangerate";

export function useExchangeRate() {
	const [rate, setRate] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRate = async () => {
			setLoading(true);
			try {
				const response = await fetch(EXCHANGE_RATE_API);
				if (!response.ok) throw new Error("Failed to fetch exchange rate");
				const data = await response.json();
				setRate(Number(data.rate));
			} catch (err) {
				console.error(err);
				setError("Failed to load exchange rate");
			} finally {
				setLoading(false);
			}
		};

		fetchRate();
		// Refresh every 5 minutes
		const interval = setInterval(fetchRate, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	return { rate, loading, error };
}
