/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as buses from "../buses.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as inventoryAdapter from "../inventoryAdapter.js";
import type * as operators from "../operators.js";
import type * as payments from "../payments.js";
import type * as reports from "../reports.js";
import type * as seatLocking from "../seatLocking.js";
import type * as seed from "../seed.js";
import type * as settlements from "../settlements.js";
import type * as support from "../support.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bookings: typeof bookings;
  buses: typeof buses;
  coupons: typeof coupons;
  crons: typeof crons;
  http: typeof http;
  inventoryAdapter: typeof inventoryAdapter;
  operators: typeof operators;
  payments: typeof payments;
  reports: typeof reports;
  seatLocking: typeof seatLocking;
  seed: typeof seed;
  settlements: typeof settlements;
  support: typeof support;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
