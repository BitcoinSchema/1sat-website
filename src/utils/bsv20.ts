import { Bsv20Status } from "@/constants";

// const extraSatBuffer = 10000; // 10ksat
export const minFee = 10000000; // + extraSatBuffer; // .1 BSV
export const baseFee = 50;

export const textStatus = (status: Bsv20Status) => {
	switch (status) {
		case Bsv20Status.Invalid:
			return "Invalid";
		case Bsv20Status.Pending:
			return "Pending";
		case Bsv20Status.Valid:
			return "Valid";
	}
};

export const calculateIndexingFee = (usdRate: number) => {
	// return min fee in usd
	return (minFee / usdRate).toFixed(2);
};
