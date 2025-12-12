export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[] | object;

export interface JsonObject {
	[key: string]: JsonValue;
}
