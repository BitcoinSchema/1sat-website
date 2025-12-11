import presence from "@convex-dev/presence/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(presence);
export default app;
