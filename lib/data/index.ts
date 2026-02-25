import { DataClient } from "./client";
import { MockDataClient } from "./mock";
import { ApiDataClient } from "./api";

// Determine which client to use based on environment variable
const isApiMode = process.env.NEXT_PUBLIC_DATA_MODE === "api";

export const dataClient: DataClient = isApiMode ? new ApiDataClient() : new MockDataClient();
