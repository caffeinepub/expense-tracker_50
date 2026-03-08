import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Expense {
    id: bigint;
    note: string;
    timestamp: Time;
    category: string;
    amount: number;
}
export type Time = bigint;
export interface backendInterface {
    addExpense(amount: number, category: string, note: string): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    getAllExpenses(): Promise<Array<Expense>>;
}
