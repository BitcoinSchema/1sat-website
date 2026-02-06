import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
	"delete expired CWI auth records",
	{ hours: 1 },
	internal.cwiAuth.deleteExpiredRecords,
);

export default crons;
