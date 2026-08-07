/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertasInventario from "../alertasInventario.js";
import type * as eventos from "../eventos.js";
import type * as movimientosInventario from "../movimientosInventario.js";
import type * as productos from "../productos.js";
import type * as solicitudesStock from "../solicitudesStock.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertasInventario: typeof alertasInventario;
  eventos: typeof eventos;
  movimientosInventario: typeof movimientosInventario;
  productos: typeof productos;
  solicitudesStock: typeof solicitudesStock;
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
