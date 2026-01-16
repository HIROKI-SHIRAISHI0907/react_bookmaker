
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model team_member_master
 * 
 */
export type team_member_master = $Result.DefaultSelection<Prisma.$team_member_masterPayload>
/**
 * Model country_league_master
 * 
 */
export type country_league_master = $Result.DefaultSelection<Prisma.$country_league_masterPayload>
/**
 * Model country_league_season_master
 * 
 */
export type country_league_season_master = $Result.DefaultSelection<Prisma.$country_league_season_masterPayload>
/**
 * Model team_color_master
 * 
 */
export type team_color_master = $Result.DefaultSelection<Prisma.$team_color_masterPayload>
/**
 * Model future_master
 * 
 */
export type future_master = $Result.DefaultSelection<Prisma.$future_masterPayload>
/**
 * Model stat_size_finalize_master
 * 
 */
export type stat_size_finalize_master = $Result.DefaultSelection<Prisma.$stat_size_finalize_masterPayload>
/**
 * Model batch_job_exec
 * 
 */
export type batch_job_exec = $Result.DefaultSelection<Prisma.$batch_job_execPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Team_member_masters
 * const team_member_masters = await prisma.team_member_master.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Team_member_masters
   * const team_member_masters = await prisma.team_member_master.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.team_member_master`: Exposes CRUD operations for the **team_member_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Team_member_masters
    * const team_member_masters = await prisma.team_member_master.findMany()
    * ```
    */
  get team_member_master(): Prisma.team_member_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.country_league_master`: Exposes CRUD operations for the **country_league_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Country_league_masters
    * const country_league_masters = await prisma.country_league_master.findMany()
    * ```
    */
  get country_league_master(): Prisma.country_league_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.country_league_season_master`: Exposes CRUD operations for the **country_league_season_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Country_league_season_masters
    * const country_league_season_masters = await prisma.country_league_season_master.findMany()
    * ```
    */
  get country_league_season_master(): Prisma.country_league_season_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.team_color_master`: Exposes CRUD operations for the **team_color_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Team_color_masters
    * const team_color_masters = await prisma.team_color_master.findMany()
    * ```
    */
  get team_color_master(): Prisma.team_color_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.future_master`: Exposes CRUD operations for the **future_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Future_masters
    * const future_masters = await prisma.future_master.findMany()
    * ```
    */
  get future_master(): Prisma.future_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.stat_size_finalize_master`: Exposes CRUD operations for the **stat_size_finalize_master** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Stat_size_finalize_masters
    * const stat_size_finalize_masters = await prisma.stat_size_finalize_master.findMany()
    * ```
    */
  get stat_size_finalize_master(): Prisma.stat_size_finalize_masterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.batch_job_exec`: Exposes CRUD operations for the **batch_job_exec** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Batch_job_execs
    * const batch_job_execs = await prisma.batch_job_exec.findMany()
    * ```
    */
  get batch_job_exec(): Prisma.batch_job_execDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.1
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    team_member_master: 'team_member_master',
    country_league_master: 'country_league_master',
    country_league_season_master: 'country_league_season_master',
    team_color_master: 'team_color_master',
    future_master: 'future_master',
    stat_size_finalize_master: 'stat_size_finalize_master',
    batch_job_exec: 'batch_job_exec'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "team_member_master" | "country_league_master" | "country_league_season_master" | "team_color_master" | "future_master" | "stat_size_finalize_master" | "batch_job_exec"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      team_member_master: {
        payload: Prisma.$team_member_masterPayload<ExtArgs>
        fields: Prisma.team_member_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.team_member_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.team_member_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          findFirst: {
            args: Prisma.team_member_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.team_member_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          findMany: {
            args: Prisma.team_member_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>[]
          }
          create: {
            args: Prisma.team_member_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          createMany: {
            args: Prisma.team_member_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.team_member_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>[]
          }
          delete: {
            args: Prisma.team_member_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          update: {
            args: Prisma.team_member_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          deleteMany: {
            args: Prisma.team_member_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.team_member_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.team_member_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>[]
          }
          upsert: {
            args: Prisma.team_member_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_member_masterPayload>
          }
          aggregate: {
            args: Prisma.Team_member_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeam_member_master>
          }
          groupBy: {
            args: Prisma.team_member_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Team_member_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.team_member_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Team_member_masterCountAggregateOutputType> | number
          }
        }
      }
      country_league_master: {
        payload: Prisma.$country_league_masterPayload<ExtArgs>
        fields: Prisma.country_league_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.country_league_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.country_league_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          findFirst: {
            args: Prisma.country_league_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.country_league_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          findMany: {
            args: Prisma.country_league_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>[]
          }
          create: {
            args: Prisma.country_league_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          createMany: {
            args: Prisma.country_league_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.country_league_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>[]
          }
          delete: {
            args: Prisma.country_league_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          update: {
            args: Prisma.country_league_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          deleteMany: {
            args: Prisma.country_league_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.country_league_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.country_league_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>[]
          }
          upsert: {
            args: Prisma.country_league_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_masterPayload>
          }
          aggregate: {
            args: Prisma.Country_league_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCountry_league_master>
          }
          groupBy: {
            args: Prisma.country_league_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Country_league_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.country_league_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Country_league_masterCountAggregateOutputType> | number
          }
        }
      }
      country_league_season_master: {
        payload: Prisma.$country_league_season_masterPayload<ExtArgs>
        fields: Prisma.country_league_season_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.country_league_season_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.country_league_season_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          findFirst: {
            args: Prisma.country_league_season_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.country_league_season_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          findMany: {
            args: Prisma.country_league_season_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>[]
          }
          create: {
            args: Prisma.country_league_season_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          createMany: {
            args: Prisma.country_league_season_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.country_league_season_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>[]
          }
          delete: {
            args: Prisma.country_league_season_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          update: {
            args: Prisma.country_league_season_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          deleteMany: {
            args: Prisma.country_league_season_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.country_league_season_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.country_league_season_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>[]
          }
          upsert: {
            args: Prisma.country_league_season_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$country_league_season_masterPayload>
          }
          aggregate: {
            args: Prisma.Country_league_season_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCountry_league_season_master>
          }
          groupBy: {
            args: Prisma.country_league_season_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Country_league_season_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.country_league_season_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Country_league_season_masterCountAggregateOutputType> | number
          }
        }
      }
      team_color_master: {
        payload: Prisma.$team_color_masterPayload<ExtArgs>
        fields: Prisma.team_color_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.team_color_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.team_color_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          findFirst: {
            args: Prisma.team_color_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.team_color_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          findMany: {
            args: Prisma.team_color_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>[]
          }
          create: {
            args: Prisma.team_color_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          createMany: {
            args: Prisma.team_color_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.team_color_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>[]
          }
          delete: {
            args: Prisma.team_color_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          update: {
            args: Prisma.team_color_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          deleteMany: {
            args: Prisma.team_color_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.team_color_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.team_color_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>[]
          }
          upsert: {
            args: Prisma.team_color_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$team_color_masterPayload>
          }
          aggregate: {
            args: Prisma.Team_color_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTeam_color_master>
          }
          groupBy: {
            args: Prisma.team_color_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Team_color_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.team_color_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Team_color_masterCountAggregateOutputType> | number
          }
        }
      }
      future_master: {
        payload: Prisma.$future_masterPayload<ExtArgs>
        fields: Prisma.future_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.future_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.future_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          findFirst: {
            args: Prisma.future_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.future_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          findMany: {
            args: Prisma.future_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>[]
          }
          create: {
            args: Prisma.future_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          createMany: {
            args: Prisma.future_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.future_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>[]
          }
          delete: {
            args: Prisma.future_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          update: {
            args: Prisma.future_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          deleteMany: {
            args: Prisma.future_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.future_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.future_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>[]
          }
          upsert: {
            args: Prisma.future_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$future_masterPayload>
          }
          aggregate: {
            args: Prisma.Future_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFuture_master>
          }
          groupBy: {
            args: Prisma.future_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Future_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.future_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Future_masterCountAggregateOutputType> | number
          }
        }
      }
      stat_size_finalize_master: {
        payload: Prisma.$stat_size_finalize_masterPayload<ExtArgs>
        fields: Prisma.stat_size_finalize_masterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.stat_size_finalize_masterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.stat_size_finalize_masterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          findFirst: {
            args: Prisma.stat_size_finalize_masterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.stat_size_finalize_masterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          findMany: {
            args: Prisma.stat_size_finalize_masterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>[]
          }
          create: {
            args: Prisma.stat_size_finalize_masterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          createMany: {
            args: Prisma.stat_size_finalize_masterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.stat_size_finalize_masterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>[]
          }
          delete: {
            args: Prisma.stat_size_finalize_masterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          update: {
            args: Prisma.stat_size_finalize_masterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          deleteMany: {
            args: Prisma.stat_size_finalize_masterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.stat_size_finalize_masterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.stat_size_finalize_masterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>[]
          }
          upsert: {
            args: Prisma.stat_size_finalize_masterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$stat_size_finalize_masterPayload>
          }
          aggregate: {
            args: Prisma.Stat_size_finalize_masterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStat_size_finalize_master>
          }
          groupBy: {
            args: Prisma.stat_size_finalize_masterGroupByArgs<ExtArgs>
            result: $Utils.Optional<Stat_size_finalize_masterGroupByOutputType>[]
          }
          count: {
            args: Prisma.stat_size_finalize_masterCountArgs<ExtArgs>
            result: $Utils.Optional<Stat_size_finalize_masterCountAggregateOutputType> | number
          }
        }
      }
      batch_job_exec: {
        payload: Prisma.$batch_job_execPayload<ExtArgs>
        fields: Prisma.batch_job_execFieldRefs
        operations: {
          findUnique: {
            args: Prisma.batch_job_execFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.batch_job_execFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          findFirst: {
            args: Prisma.batch_job_execFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.batch_job_execFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          findMany: {
            args: Prisma.batch_job_execFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>[]
          }
          create: {
            args: Prisma.batch_job_execCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          createMany: {
            args: Prisma.batch_job_execCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.batch_job_execCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>[]
          }
          delete: {
            args: Prisma.batch_job_execDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          update: {
            args: Prisma.batch_job_execUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          deleteMany: {
            args: Prisma.batch_job_execDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.batch_job_execUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.batch_job_execUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>[]
          }
          upsert: {
            args: Prisma.batch_job_execUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$batch_job_execPayload>
          }
          aggregate: {
            args: Prisma.Batch_job_execAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBatch_job_exec>
          }
          groupBy: {
            args: Prisma.batch_job_execGroupByArgs<ExtArgs>
            result: $Utils.Optional<Batch_job_execGroupByOutputType>[]
          }
          count: {
            args: Prisma.batch_job_execCountArgs<ExtArgs>
            result: $Utils.Optional<Batch_job_execCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    team_member_master?: team_member_masterOmit
    country_league_master?: country_league_masterOmit
    country_league_season_master?: country_league_season_masterOmit
    team_color_master?: team_color_masterOmit
    future_master?: future_masterOmit
    stat_size_finalize_master?: stat_size_finalize_masterOmit
    batch_job_exec?: batch_job_execOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model team_member_master
   */

  export type AggregateTeam_member_master = {
    _count: Team_member_masterCountAggregateOutputType | null
    _avg: Team_member_masterAvgAggregateOutputType | null
    _sum: Team_member_masterSumAggregateOutputType | null
    _min: Team_member_masterMinAggregateOutputType | null
    _max: Team_member_masterMaxAggregateOutputType | null
  }

  export type Team_member_masterAvgAggregateOutputType = {
    id: number | null
  }

  export type Team_member_masterSumAggregateOutputType = {
    id: number | null
  }

  export type Team_member_masterMinAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    score: string | null
    loan_belong: string | null
    jersey: string | null
    member: string | null
    face_pic_path: string | null
    belong_list: string | null
    height: string | null
    weight: string | null
    position: string | null
    birth: string | null
    age: string | null
    market_value: string | null
    injury: string | null
    versus_team_score_data: string | null
    retire_flg: string | null
    deadline: string | null
    deadline_contract_date: string | null
    latest_info_date: string | null
    upd_stamp: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Team_member_masterMaxAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    score: string | null
    loan_belong: string | null
    jersey: string | null
    member: string | null
    face_pic_path: string | null
    belong_list: string | null
    height: string | null
    weight: string | null
    position: string | null
    birth: string | null
    age: string | null
    market_value: string | null
    injury: string | null
    versus_team_score_data: string | null
    retire_flg: string | null
    deadline: string | null
    deadline_contract_date: string | null
    latest_info_date: string | null
    upd_stamp: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Team_member_masterCountAggregateOutputType = {
    id: number
    country: number
    league: number
    team: number
    score: number
    loan_belong: number
    jersey: number
    member: number
    face_pic_path: number
    belong_list: number
    height: number
    weight: number
    position: number
    birth: number
    age: number
    market_value: number
    injury: number
    versus_team_score_data: number
    retire_flg: number
    deadline: number
    deadline_contract_date: number
    latest_info_date: number
    upd_stamp: number
    del_flg: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Team_member_masterAvgAggregateInputType = {
    id?: true
  }

  export type Team_member_masterSumAggregateInputType = {
    id?: true
  }

  export type Team_member_masterMinAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    score?: true
    loan_belong?: true
    jersey?: true
    member?: true
    face_pic_path?: true
    belong_list?: true
    height?: true
    weight?: true
    position?: true
    birth?: true
    age?: true
    market_value?: true
    injury?: true
    versus_team_score_data?: true
    retire_flg?: true
    deadline?: true
    deadline_contract_date?: true
    latest_info_date?: true
    upd_stamp?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Team_member_masterMaxAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    score?: true
    loan_belong?: true
    jersey?: true
    member?: true
    face_pic_path?: true
    belong_list?: true
    height?: true
    weight?: true
    position?: true
    birth?: true
    age?: true
    market_value?: true
    injury?: true
    versus_team_score_data?: true
    retire_flg?: true
    deadline?: true
    deadline_contract_date?: true
    latest_info_date?: true
    upd_stamp?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Team_member_masterCountAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    score?: true
    loan_belong?: true
    jersey?: true
    member?: true
    face_pic_path?: true
    belong_list?: true
    height?: true
    weight?: true
    position?: true
    birth?: true
    age?: true
    market_value?: true
    injury?: true
    versus_team_score_data?: true
    retire_flg?: true
    deadline?: true
    deadline_contract_date?: true
    latest_info_date?: true
    upd_stamp?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Team_member_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which team_member_master to aggregate.
     */
    where?: team_member_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_member_masters to fetch.
     */
    orderBy?: team_member_masterOrderByWithRelationInput | team_member_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: team_member_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_member_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_member_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned team_member_masters
    **/
    _count?: true | Team_member_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Team_member_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Team_member_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Team_member_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Team_member_masterMaxAggregateInputType
  }

  export type GetTeam_member_masterAggregateType<T extends Team_member_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateTeam_member_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeam_member_master[P]>
      : GetScalarType<T[P], AggregateTeam_member_master[P]>
  }




  export type team_member_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: team_member_masterWhereInput
    orderBy?: team_member_masterOrderByWithAggregationInput | team_member_masterOrderByWithAggregationInput[]
    by: Team_member_masterScalarFieldEnum[] | Team_member_masterScalarFieldEnum
    having?: team_member_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Team_member_masterCountAggregateInputType | true
    _avg?: Team_member_masterAvgAggregateInputType
    _sum?: Team_member_masterSumAggregateInputType
    _min?: Team_member_masterMinAggregateInputType
    _max?: Team_member_masterMaxAggregateInputType
  }

  export type Team_member_masterGroupByOutputType = {
    id: number
    country: string | null
    league: string | null
    team: string
    score: string | null
    loan_belong: string | null
    jersey: string
    member: string
    face_pic_path: string
    belong_list: string | null
    height: string | null
    weight: string | null
    position: string | null
    birth: string | null
    age: string | null
    market_value: string | null
    injury: string | null
    versus_team_score_data: string | null
    retire_flg: string | null
    deadline: string | null
    deadline_contract_date: string | null
    latest_info_date: string | null
    upd_stamp: string | null
    del_flg: string
    register_id: string
    register_time: Date
    update_id: string
    update_time: Date
    _count: Team_member_masterCountAggregateOutputType | null
    _avg: Team_member_masterAvgAggregateOutputType | null
    _sum: Team_member_masterSumAggregateOutputType | null
    _min: Team_member_masterMinAggregateOutputType | null
    _max: Team_member_masterMaxAggregateOutputType | null
  }

  type GetTeam_member_masterGroupByPayload<T extends team_member_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Team_member_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Team_member_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Team_member_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Team_member_masterGroupByOutputType[P]>
        }
      >
    >


  export type team_member_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    score?: boolean
    loan_belong?: boolean
    jersey?: boolean
    member?: boolean
    face_pic_path?: boolean
    belong_list?: boolean
    height?: boolean
    weight?: boolean
    position?: boolean
    birth?: boolean
    age?: boolean
    market_value?: boolean
    injury?: boolean
    versus_team_score_data?: boolean
    retire_flg?: boolean
    deadline?: boolean
    deadline_contract_date?: boolean
    latest_info_date?: boolean
    upd_stamp?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_member_master"]>

  export type team_member_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    score?: boolean
    loan_belong?: boolean
    jersey?: boolean
    member?: boolean
    face_pic_path?: boolean
    belong_list?: boolean
    height?: boolean
    weight?: boolean
    position?: boolean
    birth?: boolean
    age?: boolean
    market_value?: boolean
    injury?: boolean
    versus_team_score_data?: boolean
    retire_flg?: boolean
    deadline?: boolean
    deadline_contract_date?: boolean
    latest_info_date?: boolean
    upd_stamp?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_member_master"]>

  export type team_member_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    score?: boolean
    loan_belong?: boolean
    jersey?: boolean
    member?: boolean
    face_pic_path?: boolean
    belong_list?: boolean
    height?: boolean
    weight?: boolean
    position?: boolean
    birth?: boolean
    age?: boolean
    market_value?: boolean
    injury?: boolean
    versus_team_score_data?: boolean
    retire_flg?: boolean
    deadline?: boolean
    deadline_contract_date?: boolean
    latest_info_date?: boolean
    upd_stamp?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_member_master"]>

  export type team_member_masterSelectScalar = {
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    score?: boolean
    loan_belong?: boolean
    jersey?: boolean
    member?: boolean
    face_pic_path?: boolean
    belong_list?: boolean
    height?: boolean
    weight?: boolean
    position?: boolean
    birth?: boolean
    age?: boolean
    market_value?: boolean
    injury?: boolean
    versus_team_score_data?: boolean
    retire_flg?: boolean
    deadline?: boolean
    deadline_contract_date?: boolean
    latest_info_date?: boolean
    upd_stamp?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type team_member_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "country" | "league" | "team" | "score" | "loan_belong" | "jersey" | "member" | "face_pic_path" | "belong_list" | "height" | "weight" | "position" | "birth" | "age" | "market_value" | "injury" | "versus_team_score_data" | "retire_flg" | "deadline" | "deadline_contract_date" | "latest_info_date" | "upd_stamp" | "del_flg" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["team_member_master"]>

  export type $team_member_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "team_member_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      country: string | null
      league: string | null
      team: string
      score: string | null
      loan_belong: string | null
      jersey: string
      member: string
      face_pic_path: string
      belong_list: string | null
      height: string | null
      weight: string | null
      position: string | null
      birth: string | null
      age: string | null
      market_value: string | null
      injury: string | null
      versus_team_score_data: string | null
      retire_flg: string | null
      deadline: string | null
      deadline_contract_date: string | null
      latest_info_date: string | null
      upd_stamp: string | null
      del_flg: string
      register_id: string
      register_time: Date
      update_id: string
      update_time: Date
    }, ExtArgs["result"]["team_member_master"]>
    composites: {}
  }

  type team_member_masterGetPayload<S extends boolean | null | undefined | team_member_masterDefaultArgs> = $Result.GetResult<Prisma.$team_member_masterPayload, S>

  type team_member_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<team_member_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Team_member_masterCountAggregateInputType | true
    }

  export interface team_member_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['team_member_master'], meta: { name: 'team_member_master' } }
    /**
     * Find zero or one Team_member_master that matches the filter.
     * @param {team_member_masterFindUniqueArgs} args - Arguments to find a Team_member_master
     * @example
     * // Get one Team_member_master
     * const team_member_master = await prisma.team_member_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends team_member_masterFindUniqueArgs>(args: SelectSubset<T, team_member_masterFindUniqueArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Team_member_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {team_member_masterFindUniqueOrThrowArgs} args - Arguments to find a Team_member_master
     * @example
     * // Get one Team_member_master
     * const team_member_master = await prisma.team_member_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends team_member_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, team_member_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team_member_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterFindFirstArgs} args - Arguments to find a Team_member_master
     * @example
     * // Get one Team_member_master
     * const team_member_master = await prisma.team_member_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends team_member_masterFindFirstArgs>(args?: SelectSubset<T, team_member_masterFindFirstArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team_member_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterFindFirstOrThrowArgs} args - Arguments to find a Team_member_master
     * @example
     * // Get one Team_member_master
     * const team_member_master = await prisma.team_member_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends team_member_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, team_member_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Team_member_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Team_member_masters
     * const team_member_masters = await prisma.team_member_master.findMany()
     * 
     * // Get first 10 Team_member_masters
     * const team_member_masters = await prisma.team_member_master.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const team_member_masterWithIdOnly = await prisma.team_member_master.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends team_member_masterFindManyArgs>(args?: SelectSubset<T, team_member_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Team_member_master.
     * @param {team_member_masterCreateArgs} args - Arguments to create a Team_member_master.
     * @example
     * // Create one Team_member_master
     * const Team_member_master = await prisma.team_member_master.create({
     *   data: {
     *     // ... data to create a Team_member_master
     *   }
     * })
     * 
     */
    create<T extends team_member_masterCreateArgs>(args: SelectSubset<T, team_member_masterCreateArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Team_member_masters.
     * @param {team_member_masterCreateManyArgs} args - Arguments to create many Team_member_masters.
     * @example
     * // Create many Team_member_masters
     * const team_member_master = await prisma.team_member_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends team_member_masterCreateManyArgs>(args?: SelectSubset<T, team_member_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Team_member_masters and returns the data saved in the database.
     * @param {team_member_masterCreateManyAndReturnArgs} args - Arguments to create many Team_member_masters.
     * @example
     * // Create many Team_member_masters
     * const team_member_master = await prisma.team_member_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Team_member_masters and only return the `id`
     * const team_member_masterWithIdOnly = await prisma.team_member_master.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends team_member_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, team_member_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Team_member_master.
     * @param {team_member_masterDeleteArgs} args - Arguments to delete one Team_member_master.
     * @example
     * // Delete one Team_member_master
     * const Team_member_master = await prisma.team_member_master.delete({
     *   where: {
     *     // ... filter to delete one Team_member_master
     *   }
     * })
     * 
     */
    delete<T extends team_member_masterDeleteArgs>(args: SelectSubset<T, team_member_masterDeleteArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Team_member_master.
     * @param {team_member_masterUpdateArgs} args - Arguments to update one Team_member_master.
     * @example
     * // Update one Team_member_master
     * const team_member_master = await prisma.team_member_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends team_member_masterUpdateArgs>(args: SelectSubset<T, team_member_masterUpdateArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Team_member_masters.
     * @param {team_member_masterDeleteManyArgs} args - Arguments to filter Team_member_masters to delete.
     * @example
     * // Delete a few Team_member_masters
     * const { count } = await prisma.team_member_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends team_member_masterDeleteManyArgs>(args?: SelectSubset<T, team_member_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Team_member_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Team_member_masters
     * const team_member_master = await prisma.team_member_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends team_member_masterUpdateManyArgs>(args: SelectSubset<T, team_member_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Team_member_masters and returns the data updated in the database.
     * @param {team_member_masterUpdateManyAndReturnArgs} args - Arguments to update many Team_member_masters.
     * @example
     * // Update many Team_member_masters
     * const team_member_master = await prisma.team_member_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Team_member_masters and only return the `id`
     * const team_member_masterWithIdOnly = await prisma.team_member_master.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends team_member_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, team_member_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Team_member_master.
     * @param {team_member_masterUpsertArgs} args - Arguments to update or create a Team_member_master.
     * @example
     * // Update or create a Team_member_master
     * const team_member_master = await prisma.team_member_master.upsert({
     *   create: {
     *     // ... data to create a Team_member_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Team_member_master we want to update
     *   }
     * })
     */
    upsert<T extends team_member_masterUpsertArgs>(args: SelectSubset<T, team_member_masterUpsertArgs<ExtArgs>>): Prisma__team_member_masterClient<$Result.GetResult<Prisma.$team_member_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Team_member_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterCountArgs} args - Arguments to filter Team_member_masters to count.
     * @example
     * // Count the number of Team_member_masters
     * const count = await prisma.team_member_master.count({
     *   where: {
     *     // ... the filter for the Team_member_masters we want to count
     *   }
     * })
    **/
    count<T extends team_member_masterCountArgs>(
      args?: Subset<T, team_member_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Team_member_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Team_member_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Team_member_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Team_member_masterAggregateArgs>(args: Subset<T, Team_member_masterAggregateArgs>): Prisma.PrismaPromise<GetTeam_member_masterAggregateType<T>>

    /**
     * Group by Team_member_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_member_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends team_member_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: team_member_masterGroupByArgs['orderBy'] }
        : { orderBy?: team_member_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, team_member_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeam_member_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the team_member_master model
   */
  readonly fields: team_member_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for team_member_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__team_member_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the team_member_master model
   */
  interface team_member_masterFieldRefs {
    readonly id: FieldRef<"team_member_master", 'Int'>
    readonly country: FieldRef<"team_member_master", 'String'>
    readonly league: FieldRef<"team_member_master", 'String'>
    readonly team: FieldRef<"team_member_master", 'String'>
    readonly score: FieldRef<"team_member_master", 'String'>
    readonly loan_belong: FieldRef<"team_member_master", 'String'>
    readonly jersey: FieldRef<"team_member_master", 'String'>
    readonly member: FieldRef<"team_member_master", 'String'>
    readonly face_pic_path: FieldRef<"team_member_master", 'String'>
    readonly belong_list: FieldRef<"team_member_master", 'String'>
    readonly height: FieldRef<"team_member_master", 'String'>
    readonly weight: FieldRef<"team_member_master", 'String'>
    readonly position: FieldRef<"team_member_master", 'String'>
    readonly birth: FieldRef<"team_member_master", 'String'>
    readonly age: FieldRef<"team_member_master", 'String'>
    readonly market_value: FieldRef<"team_member_master", 'String'>
    readonly injury: FieldRef<"team_member_master", 'String'>
    readonly versus_team_score_data: FieldRef<"team_member_master", 'String'>
    readonly retire_flg: FieldRef<"team_member_master", 'String'>
    readonly deadline: FieldRef<"team_member_master", 'String'>
    readonly deadline_contract_date: FieldRef<"team_member_master", 'String'>
    readonly latest_info_date: FieldRef<"team_member_master", 'String'>
    readonly upd_stamp: FieldRef<"team_member_master", 'String'>
    readonly del_flg: FieldRef<"team_member_master", 'String'>
    readonly register_id: FieldRef<"team_member_master", 'String'>
    readonly register_time: FieldRef<"team_member_master", 'DateTime'>
    readonly update_id: FieldRef<"team_member_master", 'String'>
    readonly update_time: FieldRef<"team_member_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * team_member_master findUnique
   */
  export type team_member_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_member_master to fetch.
     */
    where: team_member_masterWhereUniqueInput
  }

  /**
   * team_member_master findUniqueOrThrow
   */
  export type team_member_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_member_master to fetch.
     */
    where: team_member_masterWhereUniqueInput
  }

  /**
   * team_member_master findFirst
   */
  export type team_member_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_member_master to fetch.
     */
    where?: team_member_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_member_masters to fetch.
     */
    orderBy?: team_member_masterOrderByWithRelationInput | team_member_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for team_member_masters.
     */
    cursor?: team_member_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_member_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_member_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of team_member_masters.
     */
    distinct?: Team_member_masterScalarFieldEnum | Team_member_masterScalarFieldEnum[]
  }

  /**
   * team_member_master findFirstOrThrow
   */
  export type team_member_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_member_master to fetch.
     */
    where?: team_member_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_member_masters to fetch.
     */
    orderBy?: team_member_masterOrderByWithRelationInput | team_member_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for team_member_masters.
     */
    cursor?: team_member_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_member_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_member_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of team_member_masters.
     */
    distinct?: Team_member_masterScalarFieldEnum | Team_member_masterScalarFieldEnum[]
  }

  /**
   * team_member_master findMany
   */
  export type team_member_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_member_masters to fetch.
     */
    where?: team_member_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_member_masters to fetch.
     */
    orderBy?: team_member_masterOrderByWithRelationInput | team_member_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing team_member_masters.
     */
    cursor?: team_member_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_member_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_member_masters.
     */
    skip?: number
    distinct?: Team_member_masterScalarFieldEnum | Team_member_masterScalarFieldEnum[]
  }

  /**
   * team_member_master create
   */
  export type team_member_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a team_member_master.
     */
    data: XOR<team_member_masterCreateInput, team_member_masterUncheckedCreateInput>
  }

  /**
   * team_member_master createMany
   */
  export type team_member_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many team_member_masters.
     */
    data: team_member_masterCreateManyInput | team_member_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * team_member_master createManyAndReturn
   */
  export type team_member_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * The data used to create many team_member_masters.
     */
    data: team_member_masterCreateManyInput | team_member_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * team_member_master update
   */
  export type team_member_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a team_member_master.
     */
    data: XOR<team_member_masterUpdateInput, team_member_masterUncheckedUpdateInput>
    /**
     * Choose, which team_member_master to update.
     */
    where: team_member_masterWhereUniqueInput
  }

  /**
   * team_member_master updateMany
   */
  export type team_member_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update team_member_masters.
     */
    data: XOR<team_member_masterUpdateManyMutationInput, team_member_masterUncheckedUpdateManyInput>
    /**
     * Filter which team_member_masters to update
     */
    where?: team_member_masterWhereInput
    /**
     * Limit how many team_member_masters to update.
     */
    limit?: number
  }

  /**
   * team_member_master updateManyAndReturn
   */
  export type team_member_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * The data used to update team_member_masters.
     */
    data: XOR<team_member_masterUpdateManyMutationInput, team_member_masterUncheckedUpdateManyInput>
    /**
     * Filter which team_member_masters to update
     */
    where?: team_member_masterWhereInput
    /**
     * Limit how many team_member_masters to update.
     */
    limit?: number
  }

  /**
   * team_member_master upsert
   */
  export type team_member_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the team_member_master to update in case it exists.
     */
    where: team_member_masterWhereUniqueInput
    /**
     * In case the team_member_master found by the `where` argument doesn't exist, create a new team_member_master with this data.
     */
    create: XOR<team_member_masterCreateInput, team_member_masterUncheckedCreateInput>
    /**
     * In case the team_member_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<team_member_masterUpdateInput, team_member_masterUncheckedUpdateInput>
  }

  /**
   * team_member_master delete
   */
  export type team_member_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
    /**
     * Filter which team_member_master to delete.
     */
    where: team_member_masterWhereUniqueInput
  }

  /**
   * team_member_master deleteMany
   */
  export type team_member_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which team_member_masters to delete
     */
    where?: team_member_masterWhereInput
    /**
     * Limit how many team_member_masters to delete.
     */
    limit?: number
  }

  /**
   * team_member_master without action
   */
  export type team_member_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_member_master
     */
    select?: team_member_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_member_master
     */
    omit?: team_member_masterOmit<ExtArgs> | null
  }


  /**
   * Model country_league_master
   */

  export type AggregateCountry_league_master = {
    _count: Country_league_masterCountAggregateOutputType | null
    _avg: Country_league_masterAvgAggregateOutputType | null
    _sum: Country_league_masterSumAggregateOutputType | null
    _min: Country_league_masterMinAggregateOutputType | null
    _max: Country_league_masterMaxAggregateOutputType | null
  }

  export type Country_league_masterAvgAggregateOutputType = {
    id: number | null
  }

  export type Country_league_masterSumAggregateOutputType = {
    id: number | null
  }

  export type Country_league_masterMinAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    link: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Country_league_masterMaxAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    link: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Country_league_masterCountAggregateOutputType = {
    id: number
    country: number
    league: number
    team: number
    link: number
    del_flg: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Country_league_masterAvgAggregateInputType = {
    id?: true
  }

  export type Country_league_masterSumAggregateInputType = {
    id?: true
  }

  export type Country_league_masterMinAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    link?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Country_league_masterMaxAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    link?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Country_league_masterCountAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    link?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Country_league_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which country_league_master to aggregate.
     */
    where?: country_league_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_masters to fetch.
     */
    orderBy?: country_league_masterOrderByWithRelationInput | country_league_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: country_league_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned country_league_masters
    **/
    _count?: true | Country_league_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Country_league_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Country_league_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Country_league_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Country_league_masterMaxAggregateInputType
  }

  export type GetCountry_league_masterAggregateType<T extends Country_league_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateCountry_league_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCountry_league_master[P]>
      : GetScalarType<T[P], AggregateCountry_league_master[P]>
  }




  export type country_league_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: country_league_masterWhereInput
    orderBy?: country_league_masterOrderByWithAggregationInput | country_league_masterOrderByWithAggregationInput[]
    by: Country_league_masterScalarFieldEnum[] | Country_league_masterScalarFieldEnum
    having?: country_league_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Country_league_masterCountAggregateInputType | true
    _avg?: Country_league_masterAvgAggregateInputType
    _sum?: Country_league_masterSumAggregateInputType
    _min?: Country_league_masterMinAggregateInputType
    _max?: Country_league_masterMaxAggregateInputType
  }

  export type Country_league_masterGroupByOutputType = {
    id: number
    country: string
    league: string
    team: string
    link: string
    del_flg: string
    register_id: string
    register_time: Date
    update_id: string
    update_time: Date
    _count: Country_league_masterCountAggregateOutputType | null
    _avg: Country_league_masterAvgAggregateOutputType | null
    _sum: Country_league_masterSumAggregateOutputType | null
    _min: Country_league_masterMinAggregateOutputType | null
    _max: Country_league_masterMaxAggregateOutputType | null
  }

  type GetCountry_league_masterGroupByPayload<T extends country_league_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Country_league_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Country_league_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Country_league_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Country_league_masterGroupByOutputType[P]>
        }
      >
    >


  export type country_league_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    link?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_master"]>

  export type country_league_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    link?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_master"]>

  export type country_league_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    link?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_master"]>

  export type country_league_masterSelectScalar = {
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    link?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type country_league_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "country" | "league" | "team" | "link" | "del_flg" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["country_league_master"]>

  export type $country_league_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "country_league_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      country: string
      league: string
      team: string
      link: string
      del_flg: string
      register_id: string
      register_time: Date
      update_id: string
      update_time: Date
    }, ExtArgs["result"]["country_league_master"]>
    composites: {}
  }

  type country_league_masterGetPayload<S extends boolean | null | undefined | country_league_masterDefaultArgs> = $Result.GetResult<Prisma.$country_league_masterPayload, S>

  type country_league_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<country_league_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Country_league_masterCountAggregateInputType | true
    }

  export interface country_league_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['country_league_master'], meta: { name: 'country_league_master' } }
    /**
     * Find zero or one Country_league_master that matches the filter.
     * @param {country_league_masterFindUniqueArgs} args - Arguments to find a Country_league_master
     * @example
     * // Get one Country_league_master
     * const country_league_master = await prisma.country_league_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends country_league_masterFindUniqueArgs>(args: SelectSubset<T, country_league_masterFindUniqueArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Country_league_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {country_league_masterFindUniqueOrThrowArgs} args - Arguments to find a Country_league_master
     * @example
     * // Get one Country_league_master
     * const country_league_master = await prisma.country_league_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends country_league_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, country_league_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Country_league_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterFindFirstArgs} args - Arguments to find a Country_league_master
     * @example
     * // Get one Country_league_master
     * const country_league_master = await prisma.country_league_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends country_league_masterFindFirstArgs>(args?: SelectSubset<T, country_league_masterFindFirstArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Country_league_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterFindFirstOrThrowArgs} args - Arguments to find a Country_league_master
     * @example
     * // Get one Country_league_master
     * const country_league_master = await prisma.country_league_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends country_league_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, country_league_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Country_league_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Country_league_masters
     * const country_league_masters = await prisma.country_league_master.findMany()
     * 
     * // Get first 10 Country_league_masters
     * const country_league_masters = await prisma.country_league_master.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const country_league_masterWithIdOnly = await prisma.country_league_master.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends country_league_masterFindManyArgs>(args?: SelectSubset<T, country_league_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Country_league_master.
     * @param {country_league_masterCreateArgs} args - Arguments to create a Country_league_master.
     * @example
     * // Create one Country_league_master
     * const Country_league_master = await prisma.country_league_master.create({
     *   data: {
     *     // ... data to create a Country_league_master
     *   }
     * })
     * 
     */
    create<T extends country_league_masterCreateArgs>(args: SelectSubset<T, country_league_masterCreateArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Country_league_masters.
     * @param {country_league_masterCreateManyArgs} args - Arguments to create many Country_league_masters.
     * @example
     * // Create many Country_league_masters
     * const country_league_master = await prisma.country_league_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends country_league_masterCreateManyArgs>(args?: SelectSubset<T, country_league_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Country_league_masters and returns the data saved in the database.
     * @param {country_league_masterCreateManyAndReturnArgs} args - Arguments to create many Country_league_masters.
     * @example
     * // Create many Country_league_masters
     * const country_league_master = await prisma.country_league_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Country_league_masters and only return the `id`
     * const country_league_masterWithIdOnly = await prisma.country_league_master.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends country_league_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, country_league_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Country_league_master.
     * @param {country_league_masterDeleteArgs} args - Arguments to delete one Country_league_master.
     * @example
     * // Delete one Country_league_master
     * const Country_league_master = await prisma.country_league_master.delete({
     *   where: {
     *     // ... filter to delete one Country_league_master
     *   }
     * })
     * 
     */
    delete<T extends country_league_masterDeleteArgs>(args: SelectSubset<T, country_league_masterDeleteArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Country_league_master.
     * @param {country_league_masterUpdateArgs} args - Arguments to update one Country_league_master.
     * @example
     * // Update one Country_league_master
     * const country_league_master = await prisma.country_league_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends country_league_masterUpdateArgs>(args: SelectSubset<T, country_league_masterUpdateArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Country_league_masters.
     * @param {country_league_masterDeleteManyArgs} args - Arguments to filter Country_league_masters to delete.
     * @example
     * // Delete a few Country_league_masters
     * const { count } = await prisma.country_league_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends country_league_masterDeleteManyArgs>(args?: SelectSubset<T, country_league_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Country_league_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Country_league_masters
     * const country_league_master = await prisma.country_league_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends country_league_masterUpdateManyArgs>(args: SelectSubset<T, country_league_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Country_league_masters and returns the data updated in the database.
     * @param {country_league_masterUpdateManyAndReturnArgs} args - Arguments to update many Country_league_masters.
     * @example
     * // Update many Country_league_masters
     * const country_league_master = await prisma.country_league_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Country_league_masters and only return the `id`
     * const country_league_masterWithIdOnly = await prisma.country_league_master.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends country_league_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, country_league_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Country_league_master.
     * @param {country_league_masterUpsertArgs} args - Arguments to update or create a Country_league_master.
     * @example
     * // Update or create a Country_league_master
     * const country_league_master = await prisma.country_league_master.upsert({
     *   create: {
     *     // ... data to create a Country_league_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Country_league_master we want to update
     *   }
     * })
     */
    upsert<T extends country_league_masterUpsertArgs>(args: SelectSubset<T, country_league_masterUpsertArgs<ExtArgs>>): Prisma__country_league_masterClient<$Result.GetResult<Prisma.$country_league_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Country_league_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterCountArgs} args - Arguments to filter Country_league_masters to count.
     * @example
     * // Count the number of Country_league_masters
     * const count = await prisma.country_league_master.count({
     *   where: {
     *     // ... the filter for the Country_league_masters we want to count
     *   }
     * })
    **/
    count<T extends country_league_masterCountArgs>(
      args?: Subset<T, country_league_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Country_league_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Country_league_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Country_league_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Country_league_masterAggregateArgs>(args: Subset<T, Country_league_masterAggregateArgs>): Prisma.PrismaPromise<GetCountry_league_masterAggregateType<T>>

    /**
     * Group by Country_league_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends country_league_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: country_league_masterGroupByArgs['orderBy'] }
        : { orderBy?: country_league_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, country_league_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCountry_league_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the country_league_master model
   */
  readonly fields: country_league_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for country_league_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__country_league_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the country_league_master model
   */
  interface country_league_masterFieldRefs {
    readonly id: FieldRef<"country_league_master", 'Int'>
    readonly country: FieldRef<"country_league_master", 'String'>
    readonly league: FieldRef<"country_league_master", 'String'>
    readonly team: FieldRef<"country_league_master", 'String'>
    readonly link: FieldRef<"country_league_master", 'String'>
    readonly del_flg: FieldRef<"country_league_master", 'String'>
    readonly register_id: FieldRef<"country_league_master", 'String'>
    readonly register_time: FieldRef<"country_league_master", 'DateTime'>
    readonly update_id: FieldRef<"country_league_master", 'String'>
    readonly update_time: FieldRef<"country_league_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * country_league_master findUnique
   */
  export type country_league_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_master to fetch.
     */
    where: country_league_masterWhereUniqueInput
  }

  /**
   * country_league_master findUniqueOrThrow
   */
  export type country_league_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_master to fetch.
     */
    where: country_league_masterWhereUniqueInput
  }

  /**
   * country_league_master findFirst
   */
  export type country_league_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_master to fetch.
     */
    where?: country_league_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_masters to fetch.
     */
    orderBy?: country_league_masterOrderByWithRelationInput | country_league_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for country_league_masters.
     */
    cursor?: country_league_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of country_league_masters.
     */
    distinct?: Country_league_masterScalarFieldEnum | Country_league_masterScalarFieldEnum[]
  }

  /**
   * country_league_master findFirstOrThrow
   */
  export type country_league_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_master to fetch.
     */
    where?: country_league_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_masters to fetch.
     */
    orderBy?: country_league_masterOrderByWithRelationInput | country_league_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for country_league_masters.
     */
    cursor?: country_league_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of country_league_masters.
     */
    distinct?: Country_league_masterScalarFieldEnum | Country_league_masterScalarFieldEnum[]
  }

  /**
   * country_league_master findMany
   */
  export type country_league_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_masters to fetch.
     */
    where?: country_league_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_masters to fetch.
     */
    orderBy?: country_league_masterOrderByWithRelationInput | country_league_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing country_league_masters.
     */
    cursor?: country_league_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_masters.
     */
    skip?: number
    distinct?: Country_league_masterScalarFieldEnum | Country_league_masterScalarFieldEnum[]
  }

  /**
   * country_league_master create
   */
  export type country_league_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a country_league_master.
     */
    data: XOR<country_league_masterCreateInput, country_league_masterUncheckedCreateInput>
  }

  /**
   * country_league_master createMany
   */
  export type country_league_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many country_league_masters.
     */
    data: country_league_masterCreateManyInput | country_league_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * country_league_master createManyAndReturn
   */
  export type country_league_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * The data used to create many country_league_masters.
     */
    data: country_league_masterCreateManyInput | country_league_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * country_league_master update
   */
  export type country_league_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a country_league_master.
     */
    data: XOR<country_league_masterUpdateInput, country_league_masterUncheckedUpdateInput>
    /**
     * Choose, which country_league_master to update.
     */
    where: country_league_masterWhereUniqueInput
  }

  /**
   * country_league_master updateMany
   */
  export type country_league_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update country_league_masters.
     */
    data: XOR<country_league_masterUpdateManyMutationInput, country_league_masterUncheckedUpdateManyInput>
    /**
     * Filter which country_league_masters to update
     */
    where?: country_league_masterWhereInput
    /**
     * Limit how many country_league_masters to update.
     */
    limit?: number
  }

  /**
   * country_league_master updateManyAndReturn
   */
  export type country_league_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * The data used to update country_league_masters.
     */
    data: XOR<country_league_masterUpdateManyMutationInput, country_league_masterUncheckedUpdateManyInput>
    /**
     * Filter which country_league_masters to update
     */
    where?: country_league_masterWhereInput
    /**
     * Limit how many country_league_masters to update.
     */
    limit?: number
  }

  /**
   * country_league_master upsert
   */
  export type country_league_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the country_league_master to update in case it exists.
     */
    where: country_league_masterWhereUniqueInput
    /**
     * In case the country_league_master found by the `where` argument doesn't exist, create a new country_league_master with this data.
     */
    create: XOR<country_league_masterCreateInput, country_league_masterUncheckedCreateInput>
    /**
     * In case the country_league_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<country_league_masterUpdateInput, country_league_masterUncheckedUpdateInput>
  }

  /**
   * country_league_master delete
   */
  export type country_league_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
    /**
     * Filter which country_league_master to delete.
     */
    where: country_league_masterWhereUniqueInput
  }

  /**
   * country_league_master deleteMany
   */
  export type country_league_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which country_league_masters to delete
     */
    where?: country_league_masterWhereInput
    /**
     * Limit how many country_league_masters to delete.
     */
    limit?: number
  }

  /**
   * country_league_master without action
   */
  export type country_league_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_master
     */
    select?: country_league_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_master
     */
    omit?: country_league_masterOmit<ExtArgs> | null
  }


  /**
   * Model country_league_season_master
   */

  export type AggregateCountry_league_season_master = {
    _count: Country_league_season_masterCountAggregateOutputType | null
    _avg: Country_league_season_masterAvgAggregateOutputType | null
    _sum: Country_league_season_masterSumAggregateOutputType | null
    _min: Country_league_season_masterMinAggregateOutputType | null
    _max: Country_league_season_masterMaxAggregateOutputType | null
  }

  export type Country_league_season_masterAvgAggregateOutputType = {
    id: number | null
  }

  export type Country_league_season_masterSumAggregateOutputType = {
    id: number | null
  }

  export type Country_league_season_masterMinAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    season_year: string | null
    start_season_date: Date | null
    end_season_date: Date | null
    round: string | null
    path: string | null
    icon: string | null
    valid_flg: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Country_league_season_masterMaxAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    season_year: string | null
    start_season_date: Date | null
    end_season_date: Date | null
    round: string | null
    path: string | null
    icon: string | null
    valid_flg: string | null
    del_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Country_league_season_masterCountAggregateOutputType = {
    id: number
    country: number
    league: number
    season_year: number
    start_season_date: number
    end_season_date: number
    round: number
    path: number
    icon: number
    valid_flg: number
    del_flg: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Country_league_season_masterAvgAggregateInputType = {
    id?: true
  }

  export type Country_league_season_masterSumAggregateInputType = {
    id?: true
  }

  export type Country_league_season_masterMinAggregateInputType = {
    id?: true
    country?: true
    league?: true
    season_year?: true
    start_season_date?: true
    end_season_date?: true
    round?: true
    path?: true
    icon?: true
    valid_flg?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Country_league_season_masterMaxAggregateInputType = {
    id?: true
    country?: true
    league?: true
    season_year?: true
    start_season_date?: true
    end_season_date?: true
    round?: true
    path?: true
    icon?: true
    valid_flg?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Country_league_season_masterCountAggregateInputType = {
    id?: true
    country?: true
    league?: true
    season_year?: true
    start_season_date?: true
    end_season_date?: true
    round?: true
    path?: true
    icon?: true
    valid_flg?: true
    del_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Country_league_season_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which country_league_season_master to aggregate.
     */
    where?: country_league_season_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_season_masters to fetch.
     */
    orderBy?: country_league_season_masterOrderByWithRelationInput | country_league_season_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: country_league_season_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_season_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_season_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned country_league_season_masters
    **/
    _count?: true | Country_league_season_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Country_league_season_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Country_league_season_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Country_league_season_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Country_league_season_masterMaxAggregateInputType
  }

  export type GetCountry_league_season_masterAggregateType<T extends Country_league_season_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateCountry_league_season_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCountry_league_season_master[P]>
      : GetScalarType<T[P], AggregateCountry_league_season_master[P]>
  }




  export type country_league_season_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: country_league_season_masterWhereInput
    orderBy?: country_league_season_masterOrderByWithAggregationInput | country_league_season_masterOrderByWithAggregationInput[]
    by: Country_league_season_masterScalarFieldEnum[] | Country_league_season_masterScalarFieldEnum
    having?: country_league_season_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Country_league_season_masterCountAggregateInputType | true
    _avg?: Country_league_season_masterAvgAggregateInputType
    _sum?: Country_league_season_masterSumAggregateInputType
    _min?: Country_league_season_masterMinAggregateInputType
    _max?: Country_league_season_masterMaxAggregateInputType
  }

  export type Country_league_season_masterGroupByOutputType = {
    id: number
    country: string
    league: string
    season_year: string
    start_season_date: Date | null
    end_season_date: Date | null
    round: string | null
    path: string | null
    icon: string | null
    valid_flg: string
    del_flg: string
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
    _count: Country_league_season_masterCountAggregateOutputType | null
    _avg: Country_league_season_masterAvgAggregateOutputType | null
    _sum: Country_league_season_masterSumAggregateOutputType | null
    _min: Country_league_season_masterMinAggregateOutputType | null
    _max: Country_league_season_masterMaxAggregateOutputType | null
  }

  type GetCountry_league_season_masterGroupByPayload<T extends country_league_season_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Country_league_season_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Country_league_season_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Country_league_season_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Country_league_season_masterGroupByOutputType[P]>
        }
      >
    >


  export type country_league_season_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    season_year?: boolean
    start_season_date?: boolean
    end_season_date?: boolean
    round?: boolean
    path?: boolean
    icon?: boolean
    valid_flg?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_season_master"]>

  export type country_league_season_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    season_year?: boolean
    start_season_date?: boolean
    end_season_date?: boolean
    round?: boolean
    path?: boolean
    icon?: boolean
    valid_flg?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_season_master"]>

  export type country_league_season_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    season_year?: boolean
    start_season_date?: boolean
    end_season_date?: boolean
    round?: boolean
    path?: boolean
    icon?: boolean
    valid_flg?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["country_league_season_master"]>

  export type country_league_season_masterSelectScalar = {
    id?: boolean
    country?: boolean
    league?: boolean
    season_year?: boolean
    start_season_date?: boolean
    end_season_date?: boolean
    round?: boolean
    path?: boolean
    icon?: boolean
    valid_flg?: boolean
    del_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type country_league_season_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "country" | "league" | "season_year" | "start_season_date" | "end_season_date" | "round" | "path" | "icon" | "valid_flg" | "del_flg" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["country_league_season_master"]>

  export type $country_league_season_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "country_league_season_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      country: string
      league: string
      season_year: string
      start_season_date: Date | null
      end_season_date: Date | null
      round: string | null
      path: string | null
      icon: string | null
      valid_flg: string
      del_flg: string
      register_id: string | null
      register_time: Date | null
      update_id: string | null
      update_time: Date | null
    }, ExtArgs["result"]["country_league_season_master"]>
    composites: {}
  }

  type country_league_season_masterGetPayload<S extends boolean | null | undefined | country_league_season_masterDefaultArgs> = $Result.GetResult<Prisma.$country_league_season_masterPayload, S>

  type country_league_season_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<country_league_season_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Country_league_season_masterCountAggregateInputType | true
    }

  export interface country_league_season_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['country_league_season_master'], meta: { name: 'country_league_season_master' } }
    /**
     * Find zero or one Country_league_season_master that matches the filter.
     * @param {country_league_season_masterFindUniqueArgs} args - Arguments to find a Country_league_season_master
     * @example
     * // Get one Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends country_league_season_masterFindUniqueArgs>(args: SelectSubset<T, country_league_season_masterFindUniqueArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Country_league_season_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {country_league_season_masterFindUniqueOrThrowArgs} args - Arguments to find a Country_league_season_master
     * @example
     * // Get one Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends country_league_season_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, country_league_season_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Country_league_season_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterFindFirstArgs} args - Arguments to find a Country_league_season_master
     * @example
     * // Get one Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends country_league_season_masterFindFirstArgs>(args?: SelectSubset<T, country_league_season_masterFindFirstArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Country_league_season_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterFindFirstOrThrowArgs} args - Arguments to find a Country_league_season_master
     * @example
     * // Get one Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends country_league_season_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, country_league_season_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Country_league_season_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Country_league_season_masters
     * const country_league_season_masters = await prisma.country_league_season_master.findMany()
     * 
     * // Get first 10 Country_league_season_masters
     * const country_league_season_masters = await prisma.country_league_season_master.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const country_league_season_masterWithIdOnly = await prisma.country_league_season_master.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends country_league_season_masterFindManyArgs>(args?: SelectSubset<T, country_league_season_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Country_league_season_master.
     * @param {country_league_season_masterCreateArgs} args - Arguments to create a Country_league_season_master.
     * @example
     * // Create one Country_league_season_master
     * const Country_league_season_master = await prisma.country_league_season_master.create({
     *   data: {
     *     // ... data to create a Country_league_season_master
     *   }
     * })
     * 
     */
    create<T extends country_league_season_masterCreateArgs>(args: SelectSubset<T, country_league_season_masterCreateArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Country_league_season_masters.
     * @param {country_league_season_masterCreateManyArgs} args - Arguments to create many Country_league_season_masters.
     * @example
     * // Create many Country_league_season_masters
     * const country_league_season_master = await prisma.country_league_season_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends country_league_season_masterCreateManyArgs>(args?: SelectSubset<T, country_league_season_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Country_league_season_masters and returns the data saved in the database.
     * @param {country_league_season_masterCreateManyAndReturnArgs} args - Arguments to create many Country_league_season_masters.
     * @example
     * // Create many Country_league_season_masters
     * const country_league_season_master = await prisma.country_league_season_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Country_league_season_masters and only return the `id`
     * const country_league_season_masterWithIdOnly = await prisma.country_league_season_master.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends country_league_season_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, country_league_season_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Country_league_season_master.
     * @param {country_league_season_masterDeleteArgs} args - Arguments to delete one Country_league_season_master.
     * @example
     * // Delete one Country_league_season_master
     * const Country_league_season_master = await prisma.country_league_season_master.delete({
     *   where: {
     *     // ... filter to delete one Country_league_season_master
     *   }
     * })
     * 
     */
    delete<T extends country_league_season_masterDeleteArgs>(args: SelectSubset<T, country_league_season_masterDeleteArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Country_league_season_master.
     * @param {country_league_season_masterUpdateArgs} args - Arguments to update one Country_league_season_master.
     * @example
     * // Update one Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends country_league_season_masterUpdateArgs>(args: SelectSubset<T, country_league_season_masterUpdateArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Country_league_season_masters.
     * @param {country_league_season_masterDeleteManyArgs} args - Arguments to filter Country_league_season_masters to delete.
     * @example
     * // Delete a few Country_league_season_masters
     * const { count } = await prisma.country_league_season_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends country_league_season_masterDeleteManyArgs>(args?: SelectSubset<T, country_league_season_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Country_league_season_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Country_league_season_masters
     * const country_league_season_master = await prisma.country_league_season_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends country_league_season_masterUpdateManyArgs>(args: SelectSubset<T, country_league_season_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Country_league_season_masters and returns the data updated in the database.
     * @param {country_league_season_masterUpdateManyAndReturnArgs} args - Arguments to update many Country_league_season_masters.
     * @example
     * // Update many Country_league_season_masters
     * const country_league_season_master = await prisma.country_league_season_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Country_league_season_masters and only return the `id`
     * const country_league_season_masterWithIdOnly = await prisma.country_league_season_master.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends country_league_season_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, country_league_season_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Country_league_season_master.
     * @param {country_league_season_masterUpsertArgs} args - Arguments to update or create a Country_league_season_master.
     * @example
     * // Update or create a Country_league_season_master
     * const country_league_season_master = await prisma.country_league_season_master.upsert({
     *   create: {
     *     // ... data to create a Country_league_season_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Country_league_season_master we want to update
     *   }
     * })
     */
    upsert<T extends country_league_season_masterUpsertArgs>(args: SelectSubset<T, country_league_season_masterUpsertArgs<ExtArgs>>): Prisma__country_league_season_masterClient<$Result.GetResult<Prisma.$country_league_season_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Country_league_season_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterCountArgs} args - Arguments to filter Country_league_season_masters to count.
     * @example
     * // Count the number of Country_league_season_masters
     * const count = await prisma.country_league_season_master.count({
     *   where: {
     *     // ... the filter for the Country_league_season_masters we want to count
     *   }
     * })
    **/
    count<T extends country_league_season_masterCountArgs>(
      args?: Subset<T, country_league_season_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Country_league_season_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Country_league_season_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Country_league_season_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Country_league_season_masterAggregateArgs>(args: Subset<T, Country_league_season_masterAggregateArgs>): Prisma.PrismaPromise<GetCountry_league_season_masterAggregateType<T>>

    /**
     * Group by Country_league_season_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {country_league_season_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends country_league_season_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: country_league_season_masterGroupByArgs['orderBy'] }
        : { orderBy?: country_league_season_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, country_league_season_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCountry_league_season_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the country_league_season_master model
   */
  readonly fields: country_league_season_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for country_league_season_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__country_league_season_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the country_league_season_master model
   */
  interface country_league_season_masterFieldRefs {
    readonly id: FieldRef<"country_league_season_master", 'Int'>
    readonly country: FieldRef<"country_league_season_master", 'String'>
    readonly league: FieldRef<"country_league_season_master", 'String'>
    readonly season_year: FieldRef<"country_league_season_master", 'String'>
    readonly start_season_date: FieldRef<"country_league_season_master", 'DateTime'>
    readonly end_season_date: FieldRef<"country_league_season_master", 'DateTime'>
    readonly round: FieldRef<"country_league_season_master", 'String'>
    readonly path: FieldRef<"country_league_season_master", 'String'>
    readonly icon: FieldRef<"country_league_season_master", 'String'>
    readonly valid_flg: FieldRef<"country_league_season_master", 'String'>
    readonly del_flg: FieldRef<"country_league_season_master", 'String'>
    readonly register_id: FieldRef<"country_league_season_master", 'String'>
    readonly register_time: FieldRef<"country_league_season_master", 'DateTime'>
    readonly update_id: FieldRef<"country_league_season_master", 'String'>
    readonly update_time: FieldRef<"country_league_season_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * country_league_season_master findUnique
   */
  export type country_league_season_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_season_master to fetch.
     */
    where: country_league_season_masterWhereUniqueInput
  }

  /**
   * country_league_season_master findUniqueOrThrow
   */
  export type country_league_season_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_season_master to fetch.
     */
    where: country_league_season_masterWhereUniqueInput
  }

  /**
   * country_league_season_master findFirst
   */
  export type country_league_season_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_season_master to fetch.
     */
    where?: country_league_season_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_season_masters to fetch.
     */
    orderBy?: country_league_season_masterOrderByWithRelationInput | country_league_season_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for country_league_season_masters.
     */
    cursor?: country_league_season_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_season_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_season_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of country_league_season_masters.
     */
    distinct?: Country_league_season_masterScalarFieldEnum | Country_league_season_masterScalarFieldEnum[]
  }

  /**
   * country_league_season_master findFirstOrThrow
   */
  export type country_league_season_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_season_master to fetch.
     */
    where?: country_league_season_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_season_masters to fetch.
     */
    orderBy?: country_league_season_masterOrderByWithRelationInput | country_league_season_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for country_league_season_masters.
     */
    cursor?: country_league_season_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_season_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_season_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of country_league_season_masters.
     */
    distinct?: Country_league_season_masterScalarFieldEnum | Country_league_season_masterScalarFieldEnum[]
  }

  /**
   * country_league_season_master findMany
   */
  export type country_league_season_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter, which country_league_season_masters to fetch.
     */
    where?: country_league_season_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of country_league_season_masters to fetch.
     */
    orderBy?: country_league_season_masterOrderByWithRelationInput | country_league_season_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing country_league_season_masters.
     */
    cursor?: country_league_season_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` country_league_season_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` country_league_season_masters.
     */
    skip?: number
    distinct?: Country_league_season_masterScalarFieldEnum | Country_league_season_masterScalarFieldEnum[]
  }

  /**
   * country_league_season_master create
   */
  export type country_league_season_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a country_league_season_master.
     */
    data: XOR<country_league_season_masterCreateInput, country_league_season_masterUncheckedCreateInput>
  }

  /**
   * country_league_season_master createMany
   */
  export type country_league_season_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many country_league_season_masters.
     */
    data: country_league_season_masterCreateManyInput | country_league_season_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * country_league_season_master createManyAndReturn
   */
  export type country_league_season_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * The data used to create many country_league_season_masters.
     */
    data: country_league_season_masterCreateManyInput | country_league_season_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * country_league_season_master update
   */
  export type country_league_season_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a country_league_season_master.
     */
    data: XOR<country_league_season_masterUpdateInput, country_league_season_masterUncheckedUpdateInput>
    /**
     * Choose, which country_league_season_master to update.
     */
    where: country_league_season_masterWhereUniqueInput
  }

  /**
   * country_league_season_master updateMany
   */
  export type country_league_season_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update country_league_season_masters.
     */
    data: XOR<country_league_season_masterUpdateManyMutationInput, country_league_season_masterUncheckedUpdateManyInput>
    /**
     * Filter which country_league_season_masters to update
     */
    where?: country_league_season_masterWhereInput
    /**
     * Limit how many country_league_season_masters to update.
     */
    limit?: number
  }

  /**
   * country_league_season_master updateManyAndReturn
   */
  export type country_league_season_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * The data used to update country_league_season_masters.
     */
    data: XOR<country_league_season_masterUpdateManyMutationInput, country_league_season_masterUncheckedUpdateManyInput>
    /**
     * Filter which country_league_season_masters to update
     */
    where?: country_league_season_masterWhereInput
    /**
     * Limit how many country_league_season_masters to update.
     */
    limit?: number
  }

  /**
   * country_league_season_master upsert
   */
  export type country_league_season_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the country_league_season_master to update in case it exists.
     */
    where: country_league_season_masterWhereUniqueInput
    /**
     * In case the country_league_season_master found by the `where` argument doesn't exist, create a new country_league_season_master with this data.
     */
    create: XOR<country_league_season_masterCreateInput, country_league_season_masterUncheckedCreateInput>
    /**
     * In case the country_league_season_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<country_league_season_masterUpdateInput, country_league_season_masterUncheckedUpdateInput>
  }

  /**
   * country_league_season_master delete
   */
  export type country_league_season_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
    /**
     * Filter which country_league_season_master to delete.
     */
    where: country_league_season_masterWhereUniqueInput
  }

  /**
   * country_league_season_master deleteMany
   */
  export type country_league_season_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which country_league_season_masters to delete
     */
    where?: country_league_season_masterWhereInput
    /**
     * Limit how many country_league_season_masters to delete.
     */
    limit?: number
  }

  /**
   * country_league_season_master without action
   */
  export type country_league_season_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the country_league_season_master
     */
    select?: country_league_season_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the country_league_season_master
     */
    omit?: country_league_season_masterOmit<ExtArgs> | null
  }


  /**
   * Model team_color_master
   */

  export type AggregateTeam_color_master = {
    _count: Team_color_masterCountAggregateOutputType | null
    _avg: Team_color_masterAvgAggregateOutputType | null
    _sum: Team_color_masterSumAggregateOutputType | null
    _min: Team_color_masterMinAggregateOutputType | null
    _max: Team_color_masterMaxAggregateOutputType | null
  }

  export type Team_color_masterAvgAggregateOutputType = {
    id: number | null
  }

  export type Team_color_masterSumAggregateOutputType = {
    id: number | null
  }

  export type Team_color_masterMinAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    team_color_hex: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Team_color_masterMaxAggregateOutputType = {
    id: number | null
    country: string | null
    league: string | null
    team: string | null
    team_color_hex: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Team_color_masterCountAggregateOutputType = {
    id: number
    country: number
    league: number
    team: number
    team_color_hex: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Team_color_masterAvgAggregateInputType = {
    id?: true
  }

  export type Team_color_masterSumAggregateInputType = {
    id?: true
  }

  export type Team_color_masterMinAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    team_color_hex?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Team_color_masterMaxAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    team_color_hex?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Team_color_masterCountAggregateInputType = {
    id?: true
    country?: true
    league?: true
    team?: true
    team_color_hex?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Team_color_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which team_color_master to aggregate.
     */
    where?: team_color_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_color_masters to fetch.
     */
    orderBy?: team_color_masterOrderByWithRelationInput | team_color_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: team_color_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_color_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_color_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned team_color_masters
    **/
    _count?: true | Team_color_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Team_color_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Team_color_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Team_color_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Team_color_masterMaxAggregateInputType
  }

  export type GetTeam_color_masterAggregateType<T extends Team_color_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateTeam_color_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTeam_color_master[P]>
      : GetScalarType<T[P], AggregateTeam_color_master[P]>
  }




  export type team_color_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: team_color_masterWhereInput
    orderBy?: team_color_masterOrderByWithAggregationInput | team_color_masterOrderByWithAggregationInput[]
    by: Team_color_masterScalarFieldEnum[] | Team_color_masterScalarFieldEnum
    having?: team_color_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Team_color_masterCountAggregateInputType | true
    _avg?: Team_color_masterAvgAggregateInputType
    _sum?: Team_color_masterSumAggregateInputType
    _min?: Team_color_masterMinAggregateInputType
    _max?: Team_color_masterMaxAggregateInputType
  }

  export type Team_color_masterGroupByOutputType = {
    id: number
    country: string
    league: string
    team: string
    team_color_hex: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
    _count: Team_color_masterCountAggregateOutputType | null
    _avg: Team_color_masterAvgAggregateOutputType | null
    _sum: Team_color_masterSumAggregateOutputType | null
    _min: Team_color_masterMinAggregateOutputType | null
    _max: Team_color_masterMaxAggregateOutputType | null
  }

  type GetTeam_color_masterGroupByPayload<T extends team_color_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Team_color_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Team_color_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Team_color_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Team_color_masterGroupByOutputType[P]>
        }
      >
    >


  export type team_color_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    team_color_hex?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_color_master"]>

  export type team_color_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    team_color_hex?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_color_master"]>

  export type team_color_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    team_color_hex?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["team_color_master"]>

  export type team_color_masterSelectScalar = {
    id?: boolean
    country?: boolean
    league?: boolean
    team?: boolean
    team_color_hex?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type team_color_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "country" | "league" | "team" | "team_color_hex" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["team_color_master"]>

  export type $team_color_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "team_color_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      country: string
      league: string
      team: string
      team_color_hex: string | null
      register_id: string | null
      register_time: Date | null
      update_id: string | null
      update_time: Date | null
    }, ExtArgs["result"]["team_color_master"]>
    composites: {}
  }

  type team_color_masterGetPayload<S extends boolean | null | undefined | team_color_masterDefaultArgs> = $Result.GetResult<Prisma.$team_color_masterPayload, S>

  type team_color_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<team_color_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Team_color_masterCountAggregateInputType | true
    }

  export interface team_color_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['team_color_master'], meta: { name: 'team_color_master' } }
    /**
     * Find zero or one Team_color_master that matches the filter.
     * @param {team_color_masterFindUniqueArgs} args - Arguments to find a Team_color_master
     * @example
     * // Get one Team_color_master
     * const team_color_master = await prisma.team_color_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends team_color_masterFindUniqueArgs>(args: SelectSubset<T, team_color_masterFindUniqueArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Team_color_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {team_color_masterFindUniqueOrThrowArgs} args - Arguments to find a Team_color_master
     * @example
     * // Get one Team_color_master
     * const team_color_master = await prisma.team_color_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends team_color_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, team_color_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team_color_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterFindFirstArgs} args - Arguments to find a Team_color_master
     * @example
     * // Get one Team_color_master
     * const team_color_master = await prisma.team_color_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends team_color_masterFindFirstArgs>(args?: SelectSubset<T, team_color_masterFindFirstArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Team_color_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterFindFirstOrThrowArgs} args - Arguments to find a Team_color_master
     * @example
     * // Get one Team_color_master
     * const team_color_master = await prisma.team_color_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends team_color_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, team_color_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Team_color_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Team_color_masters
     * const team_color_masters = await prisma.team_color_master.findMany()
     * 
     * // Get first 10 Team_color_masters
     * const team_color_masters = await prisma.team_color_master.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const team_color_masterWithIdOnly = await prisma.team_color_master.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends team_color_masterFindManyArgs>(args?: SelectSubset<T, team_color_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Team_color_master.
     * @param {team_color_masterCreateArgs} args - Arguments to create a Team_color_master.
     * @example
     * // Create one Team_color_master
     * const Team_color_master = await prisma.team_color_master.create({
     *   data: {
     *     // ... data to create a Team_color_master
     *   }
     * })
     * 
     */
    create<T extends team_color_masterCreateArgs>(args: SelectSubset<T, team_color_masterCreateArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Team_color_masters.
     * @param {team_color_masterCreateManyArgs} args - Arguments to create many Team_color_masters.
     * @example
     * // Create many Team_color_masters
     * const team_color_master = await prisma.team_color_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends team_color_masterCreateManyArgs>(args?: SelectSubset<T, team_color_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Team_color_masters and returns the data saved in the database.
     * @param {team_color_masterCreateManyAndReturnArgs} args - Arguments to create many Team_color_masters.
     * @example
     * // Create many Team_color_masters
     * const team_color_master = await prisma.team_color_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Team_color_masters and only return the `id`
     * const team_color_masterWithIdOnly = await prisma.team_color_master.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends team_color_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, team_color_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Team_color_master.
     * @param {team_color_masterDeleteArgs} args - Arguments to delete one Team_color_master.
     * @example
     * // Delete one Team_color_master
     * const Team_color_master = await prisma.team_color_master.delete({
     *   where: {
     *     // ... filter to delete one Team_color_master
     *   }
     * })
     * 
     */
    delete<T extends team_color_masterDeleteArgs>(args: SelectSubset<T, team_color_masterDeleteArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Team_color_master.
     * @param {team_color_masterUpdateArgs} args - Arguments to update one Team_color_master.
     * @example
     * // Update one Team_color_master
     * const team_color_master = await prisma.team_color_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends team_color_masterUpdateArgs>(args: SelectSubset<T, team_color_masterUpdateArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Team_color_masters.
     * @param {team_color_masterDeleteManyArgs} args - Arguments to filter Team_color_masters to delete.
     * @example
     * // Delete a few Team_color_masters
     * const { count } = await prisma.team_color_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends team_color_masterDeleteManyArgs>(args?: SelectSubset<T, team_color_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Team_color_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Team_color_masters
     * const team_color_master = await prisma.team_color_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends team_color_masterUpdateManyArgs>(args: SelectSubset<T, team_color_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Team_color_masters and returns the data updated in the database.
     * @param {team_color_masterUpdateManyAndReturnArgs} args - Arguments to update many Team_color_masters.
     * @example
     * // Update many Team_color_masters
     * const team_color_master = await prisma.team_color_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Team_color_masters and only return the `id`
     * const team_color_masterWithIdOnly = await prisma.team_color_master.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends team_color_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, team_color_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Team_color_master.
     * @param {team_color_masterUpsertArgs} args - Arguments to update or create a Team_color_master.
     * @example
     * // Update or create a Team_color_master
     * const team_color_master = await prisma.team_color_master.upsert({
     *   create: {
     *     // ... data to create a Team_color_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Team_color_master we want to update
     *   }
     * })
     */
    upsert<T extends team_color_masterUpsertArgs>(args: SelectSubset<T, team_color_masterUpsertArgs<ExtArgs>>): Prisma__team_color_masterClient<$Result.GetResult<Prisma.$team_color_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Team_color_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterCountArgs} args - Arguments to filter Team_color_masters to count.
     * @example
     * // Count the number of Team_color_masters
     * const count = await prisma.team_color_master.count({
     *   where: {
     *     // ... the filter for the Team_color_masters we want to count
     *   }
     * })
    **/
    count<T extends team_color_masterCountArgs>(
      args?: Subset<T, team_color_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Team_color_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Team_color_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Team_color_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Team_color_masterAggregateArgs>(args: Subset<T, Team_color_masterAggregateArgs>): Prisma.PrismaPromise<GetTeam_color_masterAggregateType<T>>

    /**
     * Group by Team_color_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {team_color_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends team_color_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: team_color_masterGroupByArgs['orderBy'] }
        : { orderBy?: team_color_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, team_color_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTeam_color_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the team_color_master model
   */
  readonly fields: team_color_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for team_color_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__team_color_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the team_color_master model
   */
  interface team_color_masterFieldRefs {
    readonly id: FieldRef<"team_color_master", 'Int'>
    readonly country: FieldRef<"team_color_master", 'String'>
    readonly league: FieldRef<"team_color_master", 'String'>
    readonly team: FieldRef<"team_color_master", 'String'>
    readonly team_color_hex: FieldRef<"team_color_master", 'String'>
    readonly register_id: FieldRef<"team_color_master", 'String'>
    readonly register_time: FieldRef<"team_color_master", 'DateTime'>
    readonly update_id: FieldRef<"team_color_master", 'String'>
    readonly update_time: FieldRef<"team_color_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * team_color_master findUnique
   */
  export type team_color_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_color_master to fetch.
     */
    where: team_color_masterWhereUniqueInput
  }

  /**
   * team_color_master findUniqueOrThrow
   */
  export type team_color_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_color_master to fetch.
     */
    where: team_color_masterWhereUniqueInput
  }

  /**
   * team_color_master findFirst
   */
  export type team_color_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_color_master to fetch.
     */
    where?: team_color_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_color_masters to fetch.
     */
    orderBy?: team_color_masterOrderByWithRelationInput | team_color_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for team_color_masters.
     */
    cursor?: team_color_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_color_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_color_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of team_color_masters.
     */
    distinct?: Team_color_masterScalarFieldEnum | Team_color_masterScalarFieldEnum[]
  }

  /**
   * team_color_master findFirstOrThrow
   */
  export type team_color_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_color_master to fetch.
     */
    where?: team_color_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_color_masters to fetch.
     */
    orderBy?: team_color_masterOrderByWithRelationInput | team_color_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for team_color_masters.
     */
    cursor?: team_color_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_color_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_color_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of team_color_masters.
     */
    distinct?: Team_color_masterScalarFieldEnum | Team_color_masterScalarFieldEnum[]
  }

  /**
   * team_color_master findMany
   */
  export type team_color_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter, which team_color_masters to fetch.
     */
    where?: team_color_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of team_color_masters to fetch.
     */
    orderBy?: team_color_masterOrderByWithRelationInput | team_color_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing team_color_masters.
     */
    cursor?: team_color_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` team_color_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` team_color_masters.
     */
    skip?: number
    distinct?: Team_color_masterScalarFieldEnum | Team_color_masterScalarFieldEnum[]
  }

  /**
   * team_color_master create
   */
  export type team_color_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a team_color_master.
     */
    data: XOR<team_color_masterCreateInput, team_color_masterUncheckedCreateInput>
  }

  /**
   * team_color_master createMany
   */
  export type team_color_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many team_color_masters.
     */
    data: team_color_masterCreateManyInput | team_color_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * team_color_master createManyAndReturn
   */
  export type team_color_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * The data used to create many team_color_masters.
     */
    data: team_color_masterCreateManyInput | team_color_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * team_color_master update
   */
  export type team_color_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a team_color_master.
     */
    data: XOR<team_color_masterUpdateInput, team_color_masterUncheckedUpdateInput>
    /**
     * Choose, which team_color_master to update.
     */
    where: team_color_masterWhereUniqueInput
  }

  /**
   * team_color_master updateMany
   */
  export type team_color_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update team_color_masters.
     */
    data: XOR<team_color_masterUpdateManyMutationInput, team_color_masterUncheckedUpdateManyInput>
    /**
     * Filter which team_color_masters to update
     */
    where?: team_color_masterWhereInput
    /**
     * Limit how many team_color_masters to update.
     */
    limit?: number
  }

  /**
   * team_color_master updateManyAndReturn
   */
  export type team_color_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * The data used to update team_color_masters.
     */
    data: XOR<team_color_masterUpdateManyMutationInput, team_color_masterUncheckedUpdateManyInput>
    /**
     * Filter which team_color_masters to update
     */
    where?: team_color_masterWhereInput
    /**
     * Limit how many team_color_masters to update.
     */
    limit?: number
  }

  /**
   * team_color_master upsert
   */
  export type team_color_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the team_color_master to update in case it exists.
     */
    where: team_color_masterWhereUniqueInput
    /**
     * In case the team_color_master found by the `where` argument doesn't exist, create a new team_color_master with this data.
     */
    create: XOR<team_color_masterCreateInput, team_color_masterUncheckedCreateInput>
    /**
     * In case the team_color_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<team_color_masterUpdateInput, team_color_masterUncheckedUpdateInput>
  }

  /**
   * team_color_master delete
   */
  export type team_color_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
    /**
     * Filter which team_color_master to delete.
     */
    where: team_color_masterWhereUniqueInput
  }

  /**
   * team_color_master deleteMany
   */
  export type team_color_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which team_color_masters to delete
     */
    where?: team_color_masterWhereInput
    /**
     * Limit how many team_color_masters to delete.
     */
    limit?: number
  }

  /**
   * team_color_master without action
   */
  export type team_color_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the team_color_master
     */
    select?: team_color_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the team_color_master
     */
    omit?: team_color_masterOmit<ExtArgs> | null
  }


  /**
   * Model future_master
   */

  export type AggregateFuture_master = {
    _count: Future_masterCountAggregateOutputType | null
    _avg: Future_masterAvgAggregateOutputType | null
    _sum: Future_masterSumAggregateOutputType | null
    _min: Future_masterMinAggregateOutputType | null
    _max: Future_masterMaxAggregateOutputType | null
  }

  export type Future_masterAvgAggregateOutputType = {
    seq: number | null
  }

  export type Future_masterSumAggregateOutputType = {
    seq: bigint | null
  }

  export type Future_masterMinAggregateOutputType = {
    seq: bigint | null
    game_team_category: string | null
    future_time: Date | null
    home_rank: string | null
    away_rank: string | null
    home_team_name: string | null
    away_team_name: string | null
    home_max_getting_scorer: string | null
    away_max_getting_scorer: string | null
    home_team_home_score: string | null
    home_team_home_lost: string | null
    away_team_home_score: string | null
    away_team_home_lost: string | null
    home_team_away_score: string | null
    home_team_away_lost: string | null
    away_team_away_score: string | null
    away_team_away_lost: string | null
    game_link: string | null
    data_time: Date | null
    start_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Future_masterMaxAggregateOutputType = {
    seq: bigint | null
    game_team_category: string | null
    future_time: Date | null
    home_rank: string | null
    away_rank: string | null
    home_team_name: string | null
    away_team_name: string | null
    home_max_getting_scorer: string | null
    away_max_getting_scorer: string | null
    home_team_home_score: string | null
    home_team_home_lost: string | null
    away_team_home_score: string | null
    away_team_home_lost: string | null
    home_team_away_score: string | null
    home_team_away_lost: string | null
    away_team_away_score: string | null
    away_team_away_lost: string | null
    game_link: string | null
    data_time: Date | null
    start_flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Future_masterCountAggregateOutputType = {
    seq: number
    game_team_category: number
    future_time: number
    home_rank: number
    away_rank: number
    home_team_name: number
    away_team_name: number
    home_max_getting_scorer: number
    away_max_getting_scorer: number
    home_team_home_score: number
    home_team_home_lost: number
    away_team_home_score: number
    away_team_home_lost: number
    home_team_away_score: number
    home_team_away_lost: number
    away_team_away_score: number
    away_team_away_lost: number
    game_link: number
    data_time: number
    start_flg: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Future_masterAvgAggregateInputType = {
    seq?: true
  }

  export type Future_masterSumAggregateInputType = {
    seq?: true
  }

  export type Future_masterMinAggregateInputType = {
    seq?: true
    game_team_category?: true
    future_time?: true
    home_rank?: true
    away_rank?: true
    home_team_name?: true
    away_team_name?: true
    home_max_getting_scorer?: true
    away_max_getting_scorer?: true
    home_team_home_score?: true
    home_team_home_lost?: true
    away_team_home_score?: true
    away_team_home_lost?: true
    home_team_away_score?: true
    home_team_away_lost?: true
    away_team_away_score?: true
    away_team_away_lost?: true
    game_link?: true
    data_time?: true
    start_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Future_masterMaxAggregateInputType = {
    seq?: true
    game_team_category?: true
    future_time?: true
    home_rank?: true
    away_rank?: true
    home_team_name?: true
    away_team_name?: true
    home_max_getting_scorer?: true
    away_max_getting_scorer?: true
    home_team_home_score?: true
    home_team_home_lost?: true
    away_team_home_score?: true
    away_team_home_lost?: true
    home_team_away_score?: true
    home_team_away_lost?: true
    away_team_away_score?: true
    away_team_away_lost?: true
    game_link?: true
    data_time?: true
    start_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Future_masterCountAggregateInputType = {
    seq?: true
    game_team_category?: true
    future_time?: true
    home_rank?: true
    away_rank?: true
    home_team_name?: true
    away_team_name?: true
    home_max_getting_scorer?: true
    away_max_getting_scorer?: true
    home_team_home_score?: true
    home_team_home_lost?: true
    away_team_home_score?: true
    away_team_home_lost?: true
    home_team_away_score?: true
    home_team_away_lost?: true
    away_team_away_score?: true
    away_team_away_lost?: true
    game_link?: true
    data_time?: true
    start_flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Future_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which future_master to aggregate.
     */
    where?: future_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of future_masters to fetch.
     */
    orderBy?: future_masterOrderByWithRelationInput | future_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: future_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` future_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` future_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned future_masters
    **/
    _count?: true | Future_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Future_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Future_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Future_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Future_masterMaxAggregateInputType
  }

  export type GetFuture_masterAggregateType<T extends Future_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateFuture_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFuture_master[P]>
      : GetScalarType<T[P], AggregateFuture_master[P]>
  }




  export type future_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: future_masterWhereInput
    orderBy?: future_masterOrderByWithAggregationInput | future_masterOrderByWithAggregationInput[]
    by: Future_masterScalarFieldEnum[] | Future_masterScalarFieldEnum
    having?: future_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Future_masterCountAggregateInputType | true
    _avg?: Future_masterAvgAggregateInputType
    _sum?: Future_masterSumAggregateInputType
    _min?: Future_masterMinAggregateInputType
    _max?: Future_masterMaxAggregateInputType
  }

  export type Future_masterGroupByOutputType = {
    seq: bigint
    game_team_category: string
    future_time: Date
    home_rank: string | null
    away_rank: string | null
    home_team_name: string | null
    away_team_name: string | null
    home_max_getting_scorer: string | null
    away_max_getting_scorer: string | null
    home_team_home_score: string | null
    home_team_home_lost: string | null
    away_team_home_score: string | null
    away_team_home_lost: string | null
    home_team_away_score: string | null
    home_team_away_lost: string | null
    away_team_away_score: string | null
    away_team_away_lost: string | null
    game_link: string | null
    data_time: Date | null
    start_flg: string
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
    _count: Future_masterCountAggregateOutputType | null
    _avg: Future_masterAvgAggregateOutputType | null
    _sum: Future_masterSumAggregateOutputType | null
    _min: Future_masterMinAggregateOutputType | null
    _max: Future_masterMaxAggregateOutputType | null
  }

  type GetFuture_masterGroupByPayload<T extends future_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Future_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Future_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Future_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Future_masterGroupByOutputType[P]>
        }
      >
    >


  export type future_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    seq?: boolean
    game_team_category?: boolean
    future_time?: boolean
    home_rank?: boolean
    away_rank?: boolean
    home_team_name?: boolean
    away_team_name?: boolean
    home_max_getting_scorer?: boolean
    away_max_getting_scorer?: boolean
    home_team_home_score?: boolean
    home_team_home_lost?: boolean
    away_team_home_score?: boolean
    away_team_home_lost?: boolean
    home_team_away_score?: boolean
    home_team_away_lost?: boolean
    away_team_away_score?: boolean
    away_team_away_lost?: boolean
    game_link?: boolean
    data_time?: boolean
    start_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["future_master"]>

  export type future_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    seq?: boolean
    game_team_category?: boolean
    future_time?: boolean
    home_rank?: boolean
    away_rank?: boolean
    home_team_name?: boolean
    away_team_name?: boolean
    home_max_getting_scorer?: boolean
    away_max_getting_scorer?: boolean
    home_team_home_score?: boolean
    home_team_home_lost?: boolean
    away_team_home_score?: boolean
    away_team_home_lost?: boolean
    home_team_away_score?: boolean
    home_team_away_lost?: boolean
    away_team_away_score?: boolean
    away_team_away_lost?: boolean
    game_link?: boolean
    data_time?: boolean
    start_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["future_master"]>

  export type future_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    seq?: boolean
    game_team_category?: boolean
    future_time?: boolean
    home_rank?: boolean
    away_rank?: boolean
    home_team_name?: boolean
    away_team_name?: boolean
    home_max_getting_scorer?: boolean
    away_max_getting_scorer?: boolean
    home_team_home_score?: boolean
    home_team_home_lost?: boolean
    away_team_home_score?: boolean
    away_team_home_lost?: boolean
    home_team_away_score?: boolean
    home_team_away_lost?: boolean
    away_team_away_score?: boolean
    away_team_away_lost?: boolean
    game_link?: boolean
    data_time?: boolean
    start_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["future_master"]>

  export type future_masterSelectScalar = {
    seq?: boolean
    game_team_category?: boolean
    future_time?: boolean
    home_rank?: boolean
    away_rank?: boolean
    home_team_name?: boolean
    away_team_name?: boolean
    home_max_getting_scorer?: boolean
    away_max_getting_scorer?: boolean
    home_team_home_score?: boolean
    home_team_home_lost?: boolean
    away_team_home_score?: boolean
    away_team_home_lost?: boolean
    home_team_away_score?: boolean
    home_team_away_lost?: boolean
    away_team_away_score?: boolean
    away_team_away_lost?: boolean
    game_link?: boolean
    data_time?: boolean
    start_flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type future_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"seq" | "game_team_category" | "future_time" | "home_rank" | "away_rank" | "home_team_name" | "away_team_name" | "home_max_getting_scorer" | "away_max_getting_scorer" | "home_team_home_score" | "home_team_home_lost" | "away_team_home_score" | "away_team_home_lost" | "home_team_away_score" | "home_team_away_lost" | "away_team_away_score" | "away_team_away_lost" | "game_link" | "data_time" | "start_flg" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["future_master"]>

  export type $future_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "future_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      seq: bigint
      game_team_category: string
      future_time: Date
      home_rank: string | null
      away_rank: string | null
      home_team_name: string | null
      away_team_name: string | null
      home_max_getting_scorer: string | null
      away_max_getting_scorer: string | null
      home_team_home_score: string | null
      home_team_home_lost: string | null
      away_team_home_score: string | null
      away_team_home_lost: string | null
      home_team_away_score: string | null
      home_team_away_lost: string | null
      away_team_away_score: string | null
      away_team_away_lost: string | null
      game_link: string | null
      data_time: Date | null
      start_flg: string
      register_id: string | null
      register_time: Date | null
      update_id: string | null
      update_time: Date | null
    }, ExtArgs["result"]["future_master"]>
    composites: {}
  }

  type future_masterGetPayload<S extends boolean | null | undefined | future_masterDefaultArgs> = $Result.GetResult<Prisma.$future_masterPayload, S>

  type future_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<future_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Future_masterCountAggregateInputType | true
    }

  export interface future_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['future_master'], meta: { name: 'future_master' } }
    /**
     * Find zero or one Future_master that matches the filter.
     * @param {future_masterFindUniqueArgs} args - Arguments to find a Future_master
     * @example
     * // Get one Future_master
     * const future_master = await prisma.future_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends future_masterFindUniqueArgs>(args: SelectSubset<T, future_masterFindUniqueArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Future_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {future_masterFindUniqueOrThrowArgs} args - Arguments to find a Future_master
     * @example
     * // Get one Future_master
     * const future_master = await prisma.future_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends future_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, future_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Future_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterFindFirstArgs} args - Arguments to find a Future_master
     * @example
     * // Get one Future_master
     * const future_master = await prisma.future_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends future_masterFindFirstArgs>(args?: SelectSubset<T, future_masterFindFirstArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Future_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterFindFirstOrThrowArgs} args - Arguments to find a Future_master
     * @example
     * // Get one Future_master
     * const future_master = await prisma.future_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends future_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, future_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Future_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Future_masters
     * const future_masters = await prisma.future_master.findMany()
     * 
     * // Get first 10 Future_masters
     * const future_masters = await prisma.future_master.findMany({ take: 10 })
     * 
     * // Only select the `seq`
     * const future_masterWithSeqOnly = await prisma.future_master.findMany({ select: { seq: true } })
     * 
     */
    findMany<T extends future_masterFindManyArgs>(args?: SelectSubset<T, future_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Future_master.
     * @param {future_masterCreateArgs} args - Arguments to create a Future_master.
     * @example
     * // Create one Future_master
     * const Future_master = await prisma.future_master.create({
     *   data: {
     *     // ... data to create a Future_master
     *   }
     * })
     * 
     */
    create<T extends future_masterCreateArgs>(args: SelectSubset<T, future_masterCreateArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Future_masters.
     * @param {future_masterCreateManyArgs} args - Arguments to create many Future_masters.
     * @example
     * // Create many Future_masters
     * const future_master = await prisma.future_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends future_masterCreateManyArgs>(args?: SelectSubset<T, future_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Future_masters and returns the data saved in the database.
     * @param {future_masterCreateManyAndReturnArgs} args - Arguments to create many Future_masters.
     * @example
     * // Create many Future_masters
     * const future_master = await prisma.future_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Future_masters and only return the `seq`
     * const future_masterWithSeqOnly = await prisma.future_master.createManyAndReturn({
     *   select: { seq: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends future_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, future_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Future_master.
     * @param {future_masterDeleteArgs} args - Arguments to delete one Future_master.
     * @example
     * // Delete one Future_master
     * const Future_master = await prisma.future_master.delete({
     *   where: {
     *     // ... filter to delete one Future_master
     *   }
     * })
     * 
     */
    delete<T extends future_masterDeleteArgs>(args: SelectSubset<T, future_masterDeleteArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Future_master.
     * @param {future_masterUpdateArgs} args - Arguments to update one Future_master.
     * @example
     * // Update one Future_master
     * const future_master = await prisma.future_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends future_masterUpdateArgs>(args: SelectSubset<T, future_masterUpdateArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Future_masters.
     * @param {future_masterDeleteManyArgs} args - Arguments to filter Future_masters to delete.
     * @example
     * // Delete a few Future_masters
     * const { count } = await prisma.future_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends future_masterDeleteManyArgs>(args?: SelectSubset<T, future_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Future_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Future_masters
     * const future_master = await prisma.future_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends future_masterUpdateManyArgs>(args: SelectSubset<T, future_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Future_masters and returns the data updated in the database.
     * @param {future_masterUpdateManyAndReturnArgs} args - Arguments to update many Future_masters.
     * @example
     * // Update many Future_masters
     * const future_master = await prisma.future_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Future_masters and only return the `seq`
     * const future_masterWithSeqOnly = await prisma.future_master.updateManyAndReturn({
     *   select: { seq: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends future_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, future_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Future_master.
     * @param {future_masterUpsertArgs} args - Arguments to update or create a Future_master.
     * @example
     * // Update or create a Future_master
     * const future_master = await prisma.future_master.upsert({
     *   create: {
     *     // ... data to create a Future_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Future_master we want to update
     *   }
     * })
     */
    upsert<T extends future_masterUpsertArgs>(args: SelectSubset<T, future_masterUpsertArgs<ExtArgs>>): Prisma__future_masterClient<$Result.GetResult<Prisma.$future_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Future_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterCountArgs} args - Arguments to filter Future_masters to count.
     * @example
     * // Count the number of Future_masters
     * const count = await prisma.future_master.count({
     *   where: {
     *     // ... the filter for the Future_masters we want to count
     *   }
     * })
    **/
    count<T extends future_masterCountArgs>(
      args?: Subset<T, future_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Future_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Future_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Future_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Future_masterAggregateArgs>(args: Subset<T, Future_masterAggregateArgs>): Prisma.PrismaPromise<GetFuture_masterAggregateType<T>>

    /**
     * Group by Future_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {future_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends future_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: future_masterGroupByArgs['orderBy'] }
        : { orderBy?: future_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, future_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFuture_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the future_master model
   */
  readonly fields: future_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for future_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__future_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the future_master model
   */
  interface future_masterFieldRefs {
    readonly seq: FieldRef<"future_master", 'BigInt'>
    readonly game_team_category: FieldRef<"future_master", 'String'>
    readonly future_time: FieldRef<"future_master", 'DateTime'>
    readonly home_rank: FieldRef<"future_master", 'String'>
    readonly away_rank: FieldRef<"future_master", 'String'>
    readonly home_team_name: FieldRef<"future_master", 'String'>
    readonly away_team_name: FieldRef<"future_master", 'String'>
    readonly home_max_getting_scorer: FieldRef<"future_master", 'String'>
    readonly away_max_getting_scorer: FieldRef<"future_master", 'String'>
    readonly home_team_home_score: FieldRef<"future_master", 'String'>
    readonly home_team_home_lost: FieldRef<"future_master", 'String'>
    readonly away_team_home_score: FieldRef<"future_master", 'String'>
    readonly away_team_home_lost: FieldRef<"future_master", 'String'>
    readonly home_team_away_score: FieldRef<"future_master", 'String'>
    readonly home_team_away_lost: FieldRef<"future_master", 'String'>
    readonly away_team_away_score: FieldRef<"future_master", 'String'>
    readonly away_team_away_lost: FieldRef<"future_master", 'String'>
    readonly game_link: FieldRef<"future_master", 'String'>
    readonly data_time: FieldRef<"future_master", 'DateTime'>
    readonly start_flg: FieldRef<"future_master", 'String'>
    readonly register_id: FieldRef<"future_master", 'String'>
    readonly register_time: FieldRef<"future_master", 'DateTime'>
    readonly update_id: FieldRef<"future_master", 'String'>
    readonly update_time: FieldRef<"future_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * future_master findUnique
   */
  export type future_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter, which future_master to fetch.
     */
    where: future_masterWhereUniqueInput
  }

  /**
   * future_master findUniqueOrThrow
   */
  export type future_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter, which future_master to fetch.
     */
    where: future_masterWhereUniqueInput
  }

  /**
   * future_master findFirst
   */
  export type future_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter, which future_master to fetch.
     */
    where?: future_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of future_masters to fetch.
     */
    orderBy?: future_masterOrderByWithRelationInput | future_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for future_masters.
     */
    cursor?: future_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` future_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` future_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of future_masters.
     */
    distinct?: Future_masterScalarFieldEnum | Future_masterScalarFieldEnum[]
  }

  /**
   * future_master findFirstOrThrow
   */
  export type future_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter, which future_master to fetch.
     */
    where?: future_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of future_masters to fetch.
     */
    orderBy?: future_masterOrderByWithRelationInput | future_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for future_masters.
     */
    cursor?: future_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` future_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` future_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of future_masters.
     */
    distinct?: Future_masterScalarFieldEnum | Future_masterScalarFieldEnum[]
  }

  /**
   * future_master findMany
   */
  export type future_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter, which future_masters to fetch.
     */
    where?: future_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of future_masters to fetch.
     */
    orderBy?: future_masterOrderByWithRelationInput | future_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing future_masters.
     */
    cursor?: future_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` future_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` future_masters.
     */
    skip?: number
    distinct?: Future_masterScalarFieldEnum | Future_masterScalarFieldEnum[]
  }

  /**
   * future_master create
   */
  export type future_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a future_master.
     */
    data: XOR<future_masterCreateInput, future_masterUncheckedCreateInput>
  }

  /**
   * future_master createMany
   */
  export type future_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many future_masters.
     */
    data: future_masterCreateManyInput | future_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * future_master createManyAndReturn
   */
  export type future_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * The data used to create many future_masters.
     */
    data: future_masterCreateManyInput | future_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * future_master update
   */
  export type future_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a future_master.
     */
    data: XOR<future_masterUpdateInput, future_masterUncheckedUpdateInput>
    /**
     * Choose, which future_master to update.
     */
    where: future_masterWhereUniqueInput
  }

  /**
   * future_master updateMany
   */
  export type future_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update future_masters.
     */
    data: XOR<future_masterUpdateManyMutationInput, future_masterUncheckedUpdateManyInput>
    /**
     * Filter which future_masters to update
     */
    where?: future_masterWhereInput
    /**
     * Limit how many future_masters to update.
     */
    limit?: number
  }

  /**
   * future_master updateManyAndReturn
   */
  export type future_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * The data used to update future_masters.
     */
    data: XOR<future_masterUpdateManyMutationInput, future_masterUncheckedUpdateManyInput>
    /**
     * Filter which future_masters to update
     */
    where?: future_masterWhereInput
    /**
     * Limit how many future_masters to update.
     */
    limit?: number
  }

  /**
   * future_master upsert
   */
  export type future_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the future_master to update in case it exists.
     */
    where: future_masterWhereUniqueInput
    /**
     * In case the future_master found by the `where` argument doesn't exist, create a new future_master with this data.
     */
    create: XOR<future_masterCreateInput, future_masterUncheckedCreateInput>
    /**
     * In case the future_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<future_masterUpdateInput, future_masterUncheckedUpdateInput>
  }

  /**
   * future_master delete
   */
  export type future_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
    /**
     * Filter which future_master to delete.
     */
    where: future_masterWhereUniqueInput
  }

  /**
   * future_master deleteMany
   */
  export type future_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which future_masters to delete
     */
    where?: future_masterWhereInput
    /**
     * Limit how many future_masters to delete.
     */
    limit?: number
  }

  /**
   * future_master without action
   */
  export type future_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the future_master
     */
    select?: future_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the future_master
     */
    omit?: future_masterOmit<ExtArgs> | null
  }


  /**
   * Model stat_size_finalize_master
   */

  export type AggregateStat_size_finalize_master = {
    _count: Stat_size_finalize_masterCountAggregateOutputType | null
    _avg: Stat_size_finalize_masterAvgAggregateOutputType | null
    _sum: Stat_size_finalize_masterSumAggregateOutputType | null
    _min: Stat_size_finalize_masterMinAggregateOutputType | null
    _max: Stat_size_finalize_masterMaxAggregateOutputType | null
  }

  export type Stat_size_finalize_masterAvgAggregateOutputType = {
    id: number | null
  }

  export type Stat_size_finalize_masterSumAggregateOutputType = {
    id: number | null
  }

  export type Stat_size_finalize_masterMinAggregateOutputType = {
    id: number | null
    option_num: string | null
    options: string | null
    flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Stat_size_finalize_masterMaxAggregateOutputType = {
    id: number | null
    option_num: string | null
    options: string | null
    flg: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Stat_size_finalize_masterCountAggregateOutputType = {
    id: number
    option_num: number
    options: number
    flg: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Stat_size_finalize_masterAvgAggregateInputType = {
    id?: true
  }

  export type Stat_size_finalize_masterSumAggregateInputType = {
    id?: true
  }

  export type Stat_size_finalize_masterMinAggregateInputType = {
    id?: true
    option_num?: true
    options?: true
    flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Stat_size_finalize_masterMaxAggregateInputType = {
    id?: true
    option_num?: true
    options?: true
    flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Stat_size_finalize_masterCountAggregateInputType = {
    id?: true
    option_num?: true
    options?: true
    flg?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Stat_size_finalize_masterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which stat_size_finalize_master to aggregate.
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of stat_size_finalize_masters to fetch.
     */
    orderBy?: stat_size_finalize_masterOrderByWithRelationInput | stat_size_finalize_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: stat_size_finalize_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` stat_size_finalize_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` stat_size_finalize_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned stat_size_finalize_masters
    **/
    _count?: true | Stat_size_finalize_masterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Stat_size_finalize_masterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Stat_size_finalize_masterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Stat_size_finalize_masterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Stat_size_finalize_masterMaxAggregateInputType
  }

  export type GetStat_size_finalize_masterAggregateType<T extends Stat_size_finalize_masterAggregateArgs> = {
        [P in keyof T & keyof AggregateStat_size_finalize_master]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStat_size_finalize_master[P]>
      : GetScalarType<T[P], AggregateStat_size_finalize_master[P]>
  }




  export type stat_size_finalize_masterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: stat_size_finalize_masterWhereInput
    orderBy?: stat_size_finalize_masterOrderByWithAggregationInput | stat_size_finalize_masterOrderByWithAggregationInput[]
    by: Stat_size_finalize_masterScalarFieldEnum[] | Stat_size_finalize_masterScalarFieldEnum
    having?: stat_size_finalize_masterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Stat_size_finalize_masterCountAggregateInputType | true
    _avg?: Stat_size_finalize_masterAvgAggregateInputType
    _sum?: Stat_size_finalize_masterSumAggregateInputType
    _min?: Stat_size_finalize_masterMinAggregateInputType
    _max?: Stat_size_finalize_masterMaxAggregateInputType
  }

  export type Stat_size_finalize_masterGroupByOutputType = {
    id: number
    option_num: string
    options: string
    flg: string
    register_id: string
    register_time: Date
    update_id: string
    update_time: Date
    _count: Stat_size_finalize_masterCountAggregateOutputType | null
    _avg: Stat_size_finalize_masterAvgAggregateOutputType | null
    _sum: Stat_size_finalize_masterSumAggregateOutputType | null
    _min: Stat_size_finalize_masterMinAggregateOutputType | null
    _max: Stat_size_finalize_masterMaxAggregateOutputType | null
  }

  type GetStat_size_finalize_masterGroupByPayload<T extends stat_size_finalize_masterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Stat_size_finalize_masterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Stat_size_finalize_masterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Stat_size_finalize_masterGroupByOutputType[P]>
            : GetScalarType<T[P], Stat_size_finalize_masterGroupByOutputType[P]>
        }
      >
    >


  export type stat_size_finalize_masterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    option_num?: boolean
    options?: boolean
    flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["stat_size_finalize_master"]>

  export type stat_size_finalize_masterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    option_num?: boolean
    options?: boolean
    flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["stat_size_finalize_master"]>

  export type stat_size_finalize_masterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    option_num?: boolean
    options?: boolean
    flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["stat_size_finalize_master"]>

  export type stat_size_finalize_masterSelectScalar = {
    id?: boolean
    option_num?: boolean
    options?: boolean
    flg?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type stat_size_finalize_masterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "option_num" | "options" | "flg" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["stat_size_finalize_master"]>

  export type $stat_size_finalize_masterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "stat_size_finalize_master"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      option_num: string
      options: string
      flg: string
      register_id: string
      register_time: Date
      update_id: string
      update_time: Date
    }, ExtArgs["result"]["stat_size_finalize_master"]>
    composites: {}
  }

  type stat_size_finalize_masterGetPayload<S extends boolean | null | undefined | stat_size_finalize_masterDefaultArgs> = $Result.GetResult<Prisma.$stat_size_finalize_masterPayload, S>

  type stat_size_finalize_masterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<stat_size_finalize_masterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Stat_size_finalize_masterCountAggregateInputType | true
    }

  export interface stat_size_finalize_masterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['stat_size_finalize_master'], meta: { name: 'stat_size_finalize_master' } }
    /**
     * Find zero or one Stat_size_finalize_master that matches the filter.
     * @param {stat_size_finalize_masterFindUniqueArgs} args - Arguments to find a Stat_size_finalize_master
     * @example
     * // Get one Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends stat_size_finalize_masterFindUniqueArgs>(args: SelectSubset<T, stat_size_finalize_masterFindUniqueArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Stat_size_finalize_master that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {stat_size_finalize_masterFindUniqueOrThrowArgs} args - Arguments to find a Stat_size_finalize_master
     * @example
     * // Get one Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends stat_size_finalize_masterFindUniqueOrThrowArgs>(args: SelectSubset<T, stat_size_finalize_masterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Stat_size_finalize_master that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterFindFirstArgs} args - Arguments to find a Stat_size_finalize_master
     * @example
     * // Get one Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends stat_size_finalize_masterFindFirstArgs>(args?: SelectSubset<T, stat_size_finalize_masterFindFirstArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Stat_size_finalize_master that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterFindFirstOrThrowArgs} args - Arguments to find a Stat_size_finalize_master
     * @example
     * // Get one Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends stat_size_finalize_masterFindFirstOrThrowArgs>(args?: SelectSubset<T, stat_size_finalize_masterFindFirstOrThrowArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Stat_size_finalize_masters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Stat_size_finalize_masters
     * const stat_size_finalize_masters = await prisma.stat_size_finalize_master.findMany()
     * 
     * // Get first 10 Stat_size_finalize_masters
     * const stat_size_finalize_masters = await prisma.stat_size_finalize_master.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stat_size_finalize_masterWithIdOnly = await prisma.stat_size_finalize_master.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends stat_size_finalize_masterFindManyArgs>(args?: SelectSubset<T, stat_size_finalize_masterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Stat_size_finalize_master.
     * @param {stat_size_finalize_masterCreateArgs} args - Arguments to create a Stat_size_finalize_master.
     * @example
     * // Create one Stat_size_finalize_master
     * const Stat_size_finalize_master = await prisma.stat_size_finalize_master.create({
     *   data: {
     *     // ... data to create a Stat_size_finalize_master
     *   }
     * })
     * 
     */
    create<T extends stat_size_finalize_masterCreateArgs>(args: SelectSubset<T, stat_size_finalize_masterCreateArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Stat_size_finalize_masters.
     * @param {stat_size_finalize_masterCreateManyArgs} args - Arguments to create many Stat_size_finalize_masters.
     * @example
     * // Create many Stat_size_finalize_masters
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends stat_size_finalize_masterCreateManyArgs>(args?: SelectSubset<T, stat_size_finalize_masterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Stat_size_finalize_masters and returns the data saved in the database.
     * @param {stat_size_finalize_masterCreateManyAndReturnArgs} args - Arguments to create many Stat_size_finalize_masters.
     * @example
     * // Create many Stat_size_finalize_masters
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Stat_size_finalize_masters and only return the `id`
     * const stat_size_finalize_masterWithIdOnly = await prisma.stat_size_finalize_master.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends stat_size_finalize_masterCreateManyAndReturnArgs>(args?: SelectSubset<T, stat_size_finalize_masterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Stat_size_finalize_master.
     * @param {stat_size_finalize_masterDeleteArgs} args - Arguments to delete one Stat_size_finalize_master.
     * @example
     * // Delete one Stat_size_finalize_master
     * const Stat_size_finalize_master = await prisma.stat_size_finalize_master.delete({
     *   where: {
     *     // ... filter to delete one Stat_size_finalize_master
     *   }
     * })
     * 
     */
    delete<T extends stat_size_finalize_masterDeleteArgs>(args: SelectSubset<T, stat_size_finalize_masterDeleteArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Stat_size_finalize_master.
     * @param {stat_size_finalize_masterUpdateArgs} args - Arguments to update one Stat_size_finalize_master.
     * @example
     * // Update one Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends stat_size_finalize_masterUpdateArgs>(args: SelectSubset<T, stat_size_finalize_masterUpdateArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Stat_size_finalize_masters.
     * @param {stat_size_finalize_masterDeleteManyArgs} args - Arguments to filter Stat_size_finalize_masters to delete.
     * @example
     * // Delete a few Stat_size_finalize_masters
     * const { count } = await prisma.stat_size_finalize_master.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends stat_size_finalize_masterDeleteManyArgs>(args?: SelectSubset<T, stat_size_finalize_masterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Stat_size_finalize_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Stat_size_finalize_masters
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends stat_size_finalize_masterUpdateManyArgs>(args: SelectSubset<T, stat_size_finalize_masterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Stat_size_finalize_masters and returns the data updated in the database.
     * @param {stat_size_finalize_masterUpdateManyAndReturnArgs} args - Arguments to update many Stat_size_finalize_masters.
     * @example
     * // Update many Stat_size_finalize_masters
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Stat_size_finalize_masters and only return the `id`
     * const stat_size_finalize_masterWithIdOnly = await prisma.stat_size_finalize_master.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends stat_size_finalize_masterUpdateManyAndReturnArgs>(args: SelectSubset<T, stat_size_finalize_masterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Stat_size_finalize_master.
     * @param {stat_size_finalize_masterUpsertArgs} args - Arguments to update or create a Stat_size_finalize_master.
     * @example
     * // Update or create a Stat_size_finalize_master
     * const stat_size_finalize_master = await prisma.stat_size_finalize_master.upsert({
     *   create: {
     *     // ... data to create a Stat_size_finalize_master
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Stat_size_finalize_master we want to update
     *   }
     * })
     */
    upsert<T extends stat_size_finalize_masterUpsertArgs>(args: SelectSubset<T, stat_size_finalize_masterUpsertArgs<ExtArgs>>): Prisma__stat_size_finalize_masterClient<$Result.GetResult<Prisma.$stat_size_finalize_masterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Stat_size_finalize_masters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterCountArgs} args - Arguments to filter Stat_size_finalize_masters to count.
     * @example
     * // Count the number of Stat_size_finalize_masters
     * const count = await prisma.stat_size_finalize_master.count({
     *   where: {
     *     // ... the filter for the Stat_size_finalize_masters we want to count
     *   }
     * })
    **/
    count<T extends stat_size_finalize_masterCountArgs>(
      args?: Subset<T, stat_size_finalize_masterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Stat_size_finalize_masterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Stat_size_finalize_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Stat_size_finalize_masterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Stat_size_finalize_masterAggregateArgs>(args: Subset<T, Stat_size_finalize_masterAggregateArgs>): Prisma.PrismaPromise<GetStat_size_finalize_masterAggregateType<T>>

    /**
     * Group by Stat_size_finalize_master.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {stat_size_finalize_masterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends stat_size_finalize_masterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: stat_size_finalize_masterGroupByArgs['orderBy'] }
        : { orderBy?: stat_size_finalize_masterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, stat_size_finalize_masterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStat_size_finalize_masterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the stat_size_finalize_master model
   */
  readonly fields: stat_size_finalize_masterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for stat_size_finalize_master.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__stat_size_finalize_masterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the stat_size_finalize_master model
   */
  interface stat_size_finalize_masterFieldRefs {
    readonly id: FieldRef<"stat_size_finalize_master", 'Int'>
    readonly option_num: FieldRef<"stat_size_finalize_master", 'String'>
    readonly options: FieldRef<"stat_size_finalize_master", 'String'>
    readonly flg: FieldRef<"stat_size_finalize_master", 'String'>
    readonly register_id: FieldRef<"stat_size_finalize_master", 'String'>
    readonly register_time: FieldRef<"stat_size_finalize_master", 'DateTime'>
    readonly update_id: FieldRef<"stat_size_finalize_master", 'String'>
    readonly update_time: FieldRef<"stat_size_finalize_master", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * stat_size_finalize_master findUnique
   */
  export type stat_size_finalize_masterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter, which stat_size_finalize_master to fetch.
     */
    where: stat_size_finalize_masterWhereUniqueInput
  }

  /**
   * stat_size_finalize_master findUniqueOrThrow
   */
  export type stat_size_finalize_masterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter, which stat_size_finalize_master to fetch.
     */
    where: stat_size_finalize_masterWhereUniqueInput
  }

  /**
   * stat_size_finalize_master findFirst
   */
  export type stat_size_finalize_masterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter, which stat_size_finalize_master to fetch.
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of stat_size_finalize_masters to fetch.
     */
    orderBy?: stat_size_finalize_masterOrderByWithRelationInput | stat_size_finalize_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for stat_size_finalize_masters.
     */
    cursor?: stat_size_finalize_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` stat_size_finalize_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` stat_size_finalize_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of stat_size_finalize_masters.
     */
    distinct?: Stat_size_finalize_masterScalarFieldEnum | Stat_size_finalize_masterScalarFieldEnum[]
  }

  /**
   * stat_size_finalize_master findFirstOrThrow
   */
  export type stat_size_finalize_masterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter, which stat_size_finalize_master to fetch.
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of stat_size_finalize_masters to fetch.
     */
    orderBy?: stat_size_finalize_masterOrderByWithRelationInput | stat_size_finalize_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for stat_size_finalize_masters.
     */
    cursor?: stat_size_finalize_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` stat_size_finalize_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` stat_size_finalize_masters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of stat_size_finalize_masters.
     */
    distinct?: Stat_size_finalize_masterScalarFieldEnum | Stat_size_finalize_masterScalarFieldEnum[]
  }

  /**
   * stat_size_finalize_master findMany
   */
  export type stat_size_finalize_masterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter, which stat_size_finalize_masters to fetch.
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of stat_size_finalize_masters to fetch.
     */
    orderBy?: stat_size_finalize_masterOrderByWithRelationInput | stat_size_finalize_masterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing stat_size_finalize_masters.
     */
    cursor?: stat_size_finalize_masterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` stat_size_finalize_masters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` stat_size_finalize_masters.
     */
    skip?: number
    distinct?: Stat_size_finalize_masterScalarFieldEnum | Stat_size_finalize_masterScalarFieldEnum[]
  }

  /**
   * stat_size_finalize_master create
   */
  export type stat_size_finalize_masterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * The data needed to create a stat_size_finalize_master.
     */
    data: XOR<stat_size_finalize_masterCreateInput, stat_size_finalize_masterUncheckedCreateInput>
  }

  /**
   * stat_size_finalize_master createMany
   */
  export type stat_size_finalize_masterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many stat_size_finalize_masters.
     */
    data: stat_size_finalize_masterCreateManyInput | stat_size_finalize_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * stat_size_finalize_master createManyAndReturn
   */
  export type stat_size_finalize_masterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * The data used to create many stat_size_finalize_masters.
     */
    data: stat_size_finalize_masterCreateManyInput | stat_size_finalize_masterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * stat_size_finalize_master update
   */
  export type stat_size_finalize_masterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * The data needed to update a stat_size_finalize_master.
     */
    data: XOR<stat_size_finalize_masterUpdateInput, stat_size_finalize_masterUncheckedUpdateInput>
    /**
     * Choose, which stat_size_finalize_master to update.
     */
    where: stat_size_finalize_masterWhereUniqueInput
  }

  /**
   * stat_size_finalize_master updateMany
   */
  export type stat_size_finalize_masterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update stat_size_finalize_masters.
     */
    data: XOR<stat_size_finalize_masterUpdateManyMutationInput, stat_size_finalize_masterUncheckedUpdateManyInput>
    /**
     * Filter which stat_size_finalize_masters to update
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * Limit how many stat_size_finalize_masters to update.
     */
    limit?: number
  }

  /**
   * stat_size_finalize_master updateManyAndReturn
   */
  export type stat_size_finalize_masterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * The data used to update stat_size_finalize_masters.
     */
    data: XOR<stat_size_finalize_masterUpdateManyMutationInput, stat_size_finalize_masterUncheckedUpdateManyInput>
    /**
     * Filter which stat_size_finalize_masters to update
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * Limit how many stat_size_finalize_masters to update.
     */
    limit?: number
  }

  /**
   * stat_size_finalize_master upsert
   */
  export type stat_size_finalize_masterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * The filter to search for the stat_size_finalize_master to update in case it exists.
     */
    where: stat_size_finalize_masterWhereUniqueInput
    /**
     * In case the stat_size_finalize_master found by the `where` argument doesn't exist, create a new stat_size_finalize_master with this data.
     */
    create: XOR<stat_size_finalize_masterCreateInput, stat_size_finalize_masterUncheckedCreateInput>
    /**
     * In case the stat_size_finalize_master was found with the provided `where` argument, update it with this data.
     */
    update: XOR<stat_size_finalize_masterUpdateInput, stat_size_finalize_masterUncheckedUpdateInput>
  }

  /**
   * stat_size_finalize_master delete
   */
  export type stat_size_finalize_masterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
    /**
     * Filter which stat_size_finalize_master to delete.
     */
    where: stat_size_finalize_masterWhereUniqueInput
  }

  /**
   * stat_size_finalize_master deleteMany
   */
  export type stat_size_finalize_masterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which stat_size_finalize_masters to delete
     */
    where?: stat_size_finalize_masterWhereInput
    /**
     * Limit how many stat_size_finalize_masters to delete.
     */
    limit?: number
  }

  /**
   * stat_size_finalize_master without action
   */
  export type stat_size_finalize_masterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the stat_size_finalize_master
     */
    select?: stat_size_finalize_masterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the stat_size_finalize_master
     */
    omit?: stat_size_finalize_masterOmit<ExtArgs> | null
  }


  /**
   * Model batch_job_exec
   */

  export type AggregateBatch_job_exec = {
    _count: Batch_job_execCountAggregateOutputType | null
    _min: Batch_job_execMinAggregateOutputType | null
    _max: Batch_job_execMaxAggregateOutputType | null
  }

  export type Batch_job_execMinAggregateOutputType = {
    job_id: string | null
    batch_cd: string | null
    status: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Batch_job_execMaxAggregateOutputType = {
    job_id: string | null
    batch_cd: string | null
    status: string | null
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
  }

  export type Batch_job_execCountAggregateOutputType = {
    job_id: number
    batch_cd: number
    status: number
    register_id: number
    register_time: number
    update_id: number
    update_time: number
    _all: number
  }


  export type Batch_job_execMinAggregateInputType = {
    job_id?: true
    batch_cd?: true
    status?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Batch_job_execMaxAggregateInputType = {
    job_id?: true
    batch_cd?: true
    status?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
  }

  export type Batch_job_execCountAggregateInputType = {
    job_id?: true
    batch_cd?: true
    status?: true
    register_id?: true
    register_time?: true
    update_id?: true
    update_time?: true
    _all?: true
  }

  export type Batch_job_execAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which batch_job_exec to aggregate.
     */
    where?: batch_job_execWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of batch_job_execs to fetch.
     */
    orderBy?: batch_job_execOrderByWithRelationInput | batch_job_execOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: batch_job_execWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` batch_job_execs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` batch_job_execs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned batch_job_execs
    **/
    _count?: true | Batch_job_execCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Batch_job_execMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Batch_job_execMaxAggregateInputType
  }

  export type GetBatch_job_execAggregateType<T extends Batch_job_execAggregateArgs> = {
        [P in keyof T & keyof AggregateBatch_job_exec]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBatch_job_exec[P]>
      : GetScalarType<T[P], AggregateBatch_job_exec[P]>
  }




  export type batch_job_execGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: batch_job_execWhereInput
    orderBy?: batch_job_execOrderByWithAggregationInput | batch_job_execOrderByWithAggregationInput[]
    by: Batch_job_execScalarFieldEnum[] | Batch_job_execScalarFieldEnum
    having?: batch_job_execScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Batch_job_execCountAggregateInputType | true
    _min?: Batch_job_execMinAggregateInputType
    _max?: Batch_job_execMaxAggregateInputType
  }

  export type Batch_job_execGroupByOutputType = {
    job_id: string
    batch_cd: string
    status: string
    register_id: string | null
    register_time: Date | null
    update_id: string | null
    update_time: Date | null
    _count: Batch_job_execCountAggregateOutputType | null
    _min: Batch_job_execMinAggregateOutputType | null
    _max: Batch_job_execMaxAggregateOutputType | null
  }

  type GetBatch_job_execGroupByPayload<T extends batch_job_execGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Batch_job_execGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Batch_job_execGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Batch_job_execGroupByOutputType[P]>
            : GetScalarType<T[P], Batch_job_execGroupByOutputType[P]>
        }
      >
    >


  export type batch_job_execSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    job_id?: boolean
    batch_cd?: boolean
    status?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["batch_job_exec"]>

  export type batch_job_execSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    job_id?: boolean
    batch_cd?: boolean
    status?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["batch_job_exec"]>

  export type batch_job_execSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    job_id?: boolean
    batch_cd?: boolean
    status?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }, ExtArgs["result"]["batch_job_exec"]>

  export type batch_job_execSelectScalar = {
    job_id?: boolean
    batch_cd?: boolean
    status?: boolean
    register_id?: boolean
    register_time?: boolean
    update_id?: boolean
    update_time?: boolean
  }

  export type batch_job_execOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"job_id" | "batch_cd" | "status" | "register_id" | "register_time" | "update_id" | "update_time", ExtArgs["result"]["batch_job_exec"]>

  export type $batch_job_execPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "batch_job_exec"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      job_id: string
      batch_cd: string
      status: string
      register_id: string | null
      register_time: Date | null
      update_id: string | null
      update_time: Date | null
    }, ExtArgs["result"]["batch_job_exec"]>
    composites: {}
  }

  type batch_job_execGetPayload<S extends boolean | null | undefined | batch_job_execDefaultArgs> = $Result.GetResult<Prisma.$batch_job_execPayload, S>

  type batch_job_execCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<batch_job_execFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Batch_job_execCountAggregateInputType | true
    }

  export interface batch_job_execDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['batch_job_exec'], meta: { name: 'batch_job_exec' } }
    /**
     * Find zero or one Batch_job_exec that matches the filter.
     * @param {batch_job_execFindUniqueArgs} args - Arguments to find a Batch_job_exec
     * @example
     * // Get one Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends batch_job_execFindUniqueArgs>(args: SelectSubset<T, batch_job_execFindUniqueArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Batch_job_exec that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {batch_job_execFindUniqueOrThrowArgs} args - Arguments to find a Batch_job_exec
     * @example
     * // Get one Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends batch_job_execFindUniqueOrThrowArgs>(args: SelectSubset<T, batch_job_execFindUniqueOrThrowArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Batch_job_exec that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execFindFirstArgs} args - Arguments to find a Batch_job_exec
     * @example
     * // Get one Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends batch_job_execFindFirstArgs>(args?: SelectSubset<T, batch_job_execFindFirstArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Batch_job_exec that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execFindFirstOrThrowArgs} args - Arguments to find a Batch_job_exec
     * @example
     * // Get one Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends batch_job_execFindFirstOrThrowArgs>(args?: SelectSubset<T, batch_job_execFindFirstOrThrowArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Batch_job_execs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Batch_job_execs
     * const batch_job_execs = await prisma.batch_job_exec.findMany()
     * 
     * // Get first 10 Batch_job_execs
     * const batch_job_execs = await prisma.batch_job_exec.findMany({ take: 10 })
     * 
     * // Only select the `job_id`
     * const batch_job_execWithJob_idOnly = await prisma.batch_job_exec.findMany({ select: { job_id: true } })
     * 
     */
    findMany<T extends batch_job_execFindManyArgs>(args?: SelectSubset<T, batch_job_execFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Batch_job_exec.
     * @param {batch_job_execCreateArgs} args - Arguments to create a Batch_job_exec.
     * @example
     * // Create one Batch_job_exec
     * const Batch_job_exec = await prisma.batch_job_exec.create({
     *   data: {
     *     // ... data to create a Batch_job_exec
     *   }
     * })
     * 
     */
    create<T extends batch_job_execCreateArgs>(args: SelectSubset<T, batch_job_execCreateArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Batch_job_execs.
     * @param {batch_job_execCreateManyArgs} args - Arguments to create many Batch_job_execs.
     * @example
     * // Create many Batch_job_execs
     * const batch_job_exec = await prisma.batch_job_exec.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends batch_job_execCreateManyArgs>(args?: SelectSubset<T, batch_job_execCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Batch_job_execs and returns the data saved in the database.
     * @param {batch_job_execCreateManyAndReturnArgs} args - Arguments to create many Batch_job_execs.
     * @example
     * // Create many Batch_job_execs
     * const batch_job_exec = await prisma.batch_job_exec.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Batch_job_execs and only return the `job_id`
     * const batch_job_execWithJob_idOnly = await prisma.batch_job_exec.createManyAndReturn({
     *   select: { job_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends batch_job_execCreateManyAndReturnArgs>(args?: SelectSubset<T, batch_job_execCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Batch_job_exec.
     * @param {batch_job_execDeleteArgs} args - Arguments to delete one Batch_job_exec.
     * @example
     * // Delete one Batch_job_exec
     * const Batch_job_exec = await prisma.batch_job_exec.delete({
     *   where: {
     *     // ... filter to delete one Batch_job_exec
     *   }
     * })
     * 
     */
    delete<T extends batch_job_execDeleteArgs>(args: SelectSubset<T, batch_job_execDeleteArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Batch_job_exec.
     * @param {batch_job_execUpdateArgs} args - Arguments to update one Batch_job_exec.
     * @example
     * // Update one Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends batch_job_execUpdateArgs>(args: SelectSubset<T, batch_job_execUpdateArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Batch_job_execs.
     * @param {batch_job_execDeleteManyArgs} args - Arguments to filter Batch_job_execs to delete.
     * @example
     * // Delete a few Batch_job_execs
     * const { count } = await prisma.batch_job_exec.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends batch_job_execDeleteManyArgs>(args?: SelectSubset<T, batch_job_execDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Batch_job_execs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Batch_job_execs
     * const batch_job_exec = await prisma.batch_job_exec.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends batch_job_execUpdateManyArgs>(args: SelectSubset<T, batch_job_execUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Batch_job_execs and returns the data updated in the database.
     * @param {batch_job_execUpdateManyAndReturnArgs} args - Arguments to update many Batch_job_execs.
     * @example
     * // Update many Batch_job_execs
     * const batch_job_exec = await prisma.batch_job_exec.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Batch_job_execs and only return the `job_id`
     * const batch_job_execWithJob_idOnly = await prisma.batch_job_exec.updateManyAndReturn({
     *   select: { job_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends batch_job_execUpdateManyAndReturnArgs>(args: SelectSubset<T, batch_job_execUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Batch_job_exec.
     * @param {batch_job_execUpsertArgs} args - Arguments to update or create a Batch_job_exec.
     * @example
     * // Update or create a Batch_job_exec
     * const batch_job_exec = await prisma.batch_job_exec.upsert({
     *   create: {
     *     // ... data to create a Batch_job_exec
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Batch_job_exec we want to update
     *   }
     * })
     */
    upsert<T extends batch_job_execUpsertArgs>(args: SelectSubset<T, batch_job_execUpsertArgs<ExtArgs>>): Prisma__batch_job_execClient<$Result.GetResult<Prisma.$batch_job_execPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Batch_job_execs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execCountArgs} args - Arguments to filter Batch_job_execs to count.
     * @example
     * // Count the number of Batch_job_execs
     * const count = await prisma.batch_job_exec.count({
     *   where: {
     *     // ... the filter for the Batch_job_execs we want to count
     *   }
     * })
    **/
    count<T extends batch_job_execCountArgs>(
      args?: Subset<T, batch_job_execCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Batch_job_execCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Batch_job_exec.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Batch_job_execAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Batch_job_execAggregateArgs>(args: Subset<T, Batch_job_execAggregateArgs>): Prisma.PrismaPromise<GetBatch_job_execAggregateType<T>>

    /**
     * Group by Batch_job_exec.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {batch_job_execGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends batch_job_execGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: batch_job_execGroupByArgs['orderBy'] }
        : { orderBy?: batch_job_execGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, batch_job_execGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBatch_job_execGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the batch_job_exec model
   */
  readonly fields: batch_job_execFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for batch_job_exec.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__batch_job_execClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the batch_job_exec model
   */
  interface batch_job_execFieldRefs {
    readonly job_id: FieldRef<"batch_job_exec", 'String'>
    readonly batch_cd: FieldRef<"batch_job_exec", 'String'>
    readonly status: FieldRef<"batch_job_exec", 'String'>
    readonly register_id: FieldRef<"batch_job_exec", 'String'>
    readonly register_time: FieldRef<"batch_job_exec", 'DateTime'>
    readonly update_id: FieldRef<"batch_job_exec", 'String'>
    readonly update_time: FieldRef<"batch_job_exec", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * batch_job_exec findUnique
   */
  export type batch_job_execFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter, which batch_job_exec to fetch.
     */
    where: batch_job_execWhereUniqueInput
  }

  /**
   * batch_job_exec findUniqueOrThrow
   */
  export type batch_job_execFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter, which batch_job_exec to fetch.
     */
    where: batch_job_execWhereUniqueInput
  }

  /**
   * batch_job_exec findFirst
   */
  export type batch_job_execFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter, which batch_job_exec to fetch.
     */
    where?: batch_job_execWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of batch_job_execs to fetch.
     */
    orderBy?: batch_job_execOrderByWithRelationInput | batch_job_execOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for batch_job_execs.
     */
    cursor?: batch_job_execWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` batch_job_execs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` batch_job_execs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of batch_job_execs.
     */
    distinct?: Batch_job_execScalarFieldEnum | Batch_job_execScalarFieldEnum[]
  }

  /**
   * batch_job_exec findFirstOrThrow
   */
  export type batch_job_execFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter, which batch_job_exec to fetch.
     */
    where?: batch_job_execWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of batch_job_execs to fetch.
     */
    orderBy?: batch_job_execOrderByWithRelationInput | batch_job_execOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for batch_job_execs.
     */
    cursor?: batch_job_execWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` batch_job_execs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` batch_job_execs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of batch_job_execs.
     */
    distinct?: Batch_job_execScalarFieldEnum | Batch_job_execScalarFieldEnum[]
  }

  /**
   * batch_job_exec findMany
   */
  export type batch_job_execFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter, which batch_job_execs to fetch.
     */
    where?: batch_job_execWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of batch_job_execs to fetch.
     */
    orderBy?: batch_job_execOrderByWithRelationInput | batch_job_execOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing batch_job_execs.
     */
    cursor?: batch_job_execWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` batch_job_execs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` batch_job_execs.
     */
    skip?: number
    distinct?: Batch_job_execScalarFieldEnum | Batch_job_execScalarFieldEnum[]
  }

  /**
   * batch_job_exec create
   */
  export type batch_job_execCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * The data needed to create a batch_job_exec.
     */
    data: XOR<batch_job_execCreateInput, batch_job_execUncheckedCreateInput>
  }

  /**
   * batch_job_exec createMany
   */
  export type batch_job_execCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many batch_job_execs.
     */
    data: batch_job_execCreateManyInput | batch_job_execCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * batch_job_exec createManyAndReturn
   */
  export type batch_job_execCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * The data used to create many batch_job_execs.
     */
    data: batch_job_execCreateManyInput | batch_job_execCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * batch_job_exec update
   */
  export type batch_job_execUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * The data needed to update a batch_job_exec.
     */
    data: XOR<batch_job_execUpdateInput, batch_job_execUncheckedUpdateInput>
    /**
     * Choose, which batch_job_exec to update.
     */
    where: batch_job_execWhereUniqueInput
  }

  /**
   * batch_job_exec updateMany
   */
  export type batch_job_execUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update batch_job_execs.
     */
    data: XOR<batch_job_execUpdateManyMutationInput, batch_job_execUncheckedUpdateManyInput>
    /**
     * Filter which batch_job_execs to update
     */
    where?: batch_job_execWhereInput
    /**
     * Limit how many batch_job_execs to update.
     */
    limit?: number
  }

  /**
   * batch_job_exec updateManyAndReturn
   */
  export type batch_job_execUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * The data used to update batch_job_execs.
     */
    data: XOR<batch_job_execUpdateManyMutationInput, batch_job_execUncheckedUpdateManyInput>
    /**
     * Filter which batch_job_execs to update
     */
    where?: batch_job_execWhereInput
    /**
     * Limit how many batch_job_execs to update.
     */
    limit?: number
  }

  /**
   * batch_job_exec upsert
   */
  export type batch_job_execUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * The filter to search for the batch_job_exec to update in case it exists.
     */
    where: batch_job_execWhereUniqueInput
    /**
     * In case the batch_job_exec found by the `where` argument doesn't exist, create a new batch_job_exec with this data.
     */
    create: XOR<batch_job_execCreateInput, batch_job_execUncheckedCreateInput>
    /**
     * In case the batch_job_exec was found with the provided `where` argument, update it with this data.
     */
    update: XOR<batch_job_execUpdateInput, batch_job_execUncheckedUpdateInput>
  }

  /**
   * batch_job_exec delete
   */
  export type batch_job_execDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
    /**
     * Filter which batch_job_exec to delete.
     */
    where: batch_job_execWhereUniqueInput
  }

  /**
   * batch_job_exec deleteMany
   */
  export type batch_job_execDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which batch_job_execs to delete
     */
    where?: batch_job_execWhereInput
    /**
     * Limit how many batch_job_execs to delete.
     */
    limit?: number
  }

  /**
   * batch_job_exec without action
   */
  export type batch_job_execDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the batch_job_exec
     */
    select?: batch_job_execSelect<ExtArgs> | null
    /**
     * Omit specific fields from the batch_job_exec
     */
    omit?: batch_job_execOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const Team_member_masterScalarFieldEnum: {
    id: 'id',
    country: 'country',
    league: 'league',
    team: 'team',
    score: 'score',
    loan_belong: 'loan_belong',
    jersey: 'jersey',
    member: 'member',
    face_pic_path: 'face_pic_path',
    belong_list: 'belong_list',
    height: 'height',
    weight: 'weight',
    position: 'position',
    birth: 'birth',
    age: 'age',
    market_value: 'market_value',
    injury: 'injury',
    versus_team_score_data: 'versus_team_score_data',
    retire_flg: 'retire_flg',
    deadline: 'deadline',
    deadline_contract_date: 'deadline_contract_date',
    latest_info_date: 'latest_info_date',
    upd_stamp: 'upd_stamp',
    del_flg: 'del_flg',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Team_member_masterScalarFieldEnum = (typeof Team_member_masterScalarFieldEnum)[keyof typeof Team_member_masterScalarFieldEnum]


  export const Country_league_masterScalarFieldEnum: {
    id: 'id',
    country: 'country',
    league: 'league',
    team: 'team',
    link: 'link',
    del_flg: 'del_flg',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Country_league_masterScalarFieldEnum = (typeof Country_league_masterScalarFieldEnum)[keyof typeof Country_league_masterScalarFieldEnum]


  export const Country_league_season_masterScalarFieldEnum: {
    id: 'id',
    country: 'country',
    league: 'league',
    season_year: 'season_year',
    start_season_date: 'start_season_date',
    end_season_date: 'end_season_date',
    round: 'round',
    path: 'path',
    icon: 'icon',
    valid_flg: 'valid_flg',
    del_flg: 'del_flg',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Country_league_season_masterScalarFieldEnum = (typeof Country_league_season_masterScalarFieldEnum)[keyof typeof Country_league_season_masterScalarFieldEnum]


  export const Team_color_masterScalarFieldEnum: {
    id: 'id',
    country: 'country',
    league: 'league',
    team: 'team',
    team_color_hex: 'team_color_hex',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Team_color_masterScalarFieldEnum = (typeof Team_color_masterScalarFieldEnum)[keyof typeof Team_color_masterScalarFieldEnum]


  export const Future_masterScalarFieldEnum: {
    seq: 'seq',
    game_team_category: 'game_team_category',
    future_time: 'future_time',
    home_rank: 'home_rank',
    away_rank: 'away_rank',
    home_team_name: 'home_team_name',
    away_team_name: 'away_team_name',
    home_max_getting_scorer: 'home_max_getting_scorer',
    away_max_getting_scorer: 'away_max_getting_scorer',
    home_team_home_score: 'home_team_home_score',
    home_team_home_lost: 'home_team_home_lost',
    away_team_home_score: 'away_team_home_score',
    away_team_home_lost: 'away_team_home_lost',
    home_team_away_score: 'home_team_away_score',
    home_team_away_lost: 'home_team_away_lost',
    away_team_away_score: 'away_team_away_score',
    away_team_away_lost: 'away_team_away_lost',
    game_link: 'game_link',
    data_time: 'data_time',
    start_flg: 'start_flg',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Future_masterScalarFieldEnum = (typeof Future_masterScalarFieldEnum)[keyof typeof Future_masterScalarFieldEnum]


  export const Stat_size_finalize_masterScalarFieldEnum: {
    id: 'id',
    option_num: 'option_num',
    options: 'options',
    flg: 'flg',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Stat_size_finalize_masterScalarFieldEnum = (typeof Stat_size_finalize_masterScalarFieldEnum)[keyof typeof Stat_size_finalize_masterScalarFieldEnum]


  export const Batch_job_execScalarFieldEnum: {
    job_id: 'job_id',
    batch_cd: 'batch_cd',
    status: 'status',
    register_id: 'register_id',
    register_time: 'register_time',
    update_id: 'update_id',
    update_time: 'update_time'
  };

  export type Batch_job_execScalarFieldEnum = (typeof Batch_job_execScalarFieldEnum)[keyof typeof Batch_job_execScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type team_member_masterWhereInput = {
    AND?: team_member_masterWhereInput | team_member_masterWhereInput[]
    OR?: team_member_masterWhereInput[]
    NOT?: team_member_masterWhereInput | team_member_masterWhereInput[]
    id?: IntFilter<"team_member_master"> | number
    country?: StringNullableFilter<"team_member_master"> | string | null
    league?: StringNullableFilter<"team_member_master"> | string | null
    team?: StringFilter<"team_member_master"> | string
    score?: StringNullableFilter<"team_member_master"> | string | null
    loan_belong?: StringNullableFilter<"team_member_master"> | string | null
    jersey?: StringFilter<"team_member_master"> | string
    member?: StringFilter<"team_member_master"> | string
    face_pic_path?: StringFilter<"team_member_master"> | string
    belong_list?: StringNullableFilter<"team_member_master"> | string | null
    height?: StringNullableFilter<"team_member_master"> | string | null
    weight?: StringNullableFilter<"team_member_master"> | string | null
    position?: StringNullableFilter<"team_member_master"> | string | null
    birth?: StringNullableFilter<"team_member_master"> | string | null
    age?: StringNullableFilter<"team_member_master"> | string | null
    market_value?: StringNullableFilter<"team_member_master"> | string | null
    injury?: StringNullableFilter<"team_member_master"> | string | null
    versus_team_score_data?: StringNullableFilter<"team_member_master"> | string | null
    retire_flg?: StringNullableFilter<"team_member_master"> | string | null
    deadline?: StringNullableFilter<"team_member_master"> | string | null
    deadline_contract_date?: StringNullableFilter<"team_member_master"> | string | null
    latest_info_date?: StringNullableFilter<"team_member_master"> | string | null
    upd_stamp?: StringNullableFilter<"team_member_master"> | string | null
    del_flg?: StringFilter<"team_member_master"> | string
    register_id?: StringFilter<"team_member_master"> | string
    register_time?: DateTimeFilter<"team_member_master"> | Date | string
    update_id?: StringFilter<"team_member_master"> | string
    update_time?: DateTimeFilter<"team_member_master"> | Date | string
  }

  export type team_member_masterOrderByWithRelationInput = {
    id?: SortOrder
    country?: SortOrderInput | SortOrder
    league?: SortOrderInput | SortOrder
    team?: SortOrder
    score?: SortOrderInput | SortOrder
    loan_belong?: SortOrderInput | SortOrder
    jersey?: SortOrder
    member?: SortOrder
    face_pic_path?: SortOrder
    belong_list?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    position?: SortOrderInput | SortOrder
    birth?: SortOrderInput | SortOrder
    age?: SortOrderInput | SortOrder
    market_value?: SortOrderInput | SortOrder
    injury?: SortOrderInput | SortOrder
    versus_team_score_data?: SortOrderInput | SortOrder
    retire_flg?: SortOrderInput | SortOrder
    deadline?: SortOrderInput | SortOrder
    deadline_contract_date?: SortOrderInput | SortOrder
    latest_info_date?: SortOrderInput | SortOrder
    upd_stamp?: SortOrderInput | SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_member_masterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    team_jersey_member_face_pic_path?: team_member_masterTeamJerseyMemberFace_pic_pathCompoundUniqueInput
    AND?: team_member_masterWhereInput | team_member_masterWhereInput[]
    OR?: team_member_masterWhereInput[]
    NOT?: team_member_masterWhereInput | team_member_masterWhereInput[]
    country?: StringNullableFilter<"team_member_master"> | string | null
    league?: StringNullableFilter<"team_member_master"> | string | null
    team?: StringFilter<"team_member_master"> | string
    score?: StringNullableFilter<"team_member_master"> | string | null
    loan_belong?: StringNullableFilter<"team_member_master"> | string | null
    jersey?: StringFilter<"team_member_master"> | string
    member?: StringFilter<"team_member_master"> | string
    face_pic_path?: StringFilter<"team_member_master"> | string
    belong_list?: StringNullableFilter<"team_member_master"> | string | null
    height?: StringNullableFilter<"team_member_master"> | string | null
    weight?: StringNullableFilter<"team_member_master"> | string | null
    position?: StringNullableFilter<"team_member_master"> | string | null
    birth?: StringNullableFilter<"team_member_master"> | string | null
    age?: StringNullableFilter<"team_member_master"> | string | null
    market_value?: StringNullableFilter<"team_member_master"> | string | null
    injury?: StringNullableFilter<"team_member_master"> | string | null
    versus_team_score_data?: StringNullableFilter<"team_member_master"> | string | null
    retire_flg?: StringNullableFilter<"team_member_master"> | string | null
    deadline?: StringNullableFilter<"team_member_master"> | string | null
    deadline_contract_date?: StringNullableFilter<"team_member_master"> | string | null
    latest_info_date?: StringNullableFilter<"team_member_master"> | string | null
    upd_stamp?: StringNullableFilter<"team_member_master"> | string | null
    del_flg?: StringFilter<"team_member_master"> | string
    register_id?: StringFilter<"team_member_master"> | string
    register_time?: DateTimeFilter<"team_member_master"> | Date | string
    update_id?: StringFilter<"team_member_master"> | string
    update_time?: DateTimeFilter<"team_member_master"> | Date | string
  }, "id" | "team_jersey_member_face_pic_path">

  export type team_member_masterOrderByWithAggregationInput = {
    id?: SortOrder
    country?: SortOrderInput | SortOrder
    league?: SortOrderInput | SortOrder
    team?: SortOrder
    score?: SortOrderInput | SortOrder
    loan_belong?: SortOrderInput | SortOrder
    jersey?: SortOrder
    member?: SortOrder
    face_pic_path?: SortOrder
    belong_list?: SortOrderInput | SortOrder
    height?: SortOrderInput | SortOrder
    weight?: SortOrderInput | SortOrder
    position?: SortOrderInput | SortOrder
    birth?: SortOrderInput | SortOrder
    age?: SortOrderInput | SortOrder
    market_value?: SortOrderInput | SortOrder
    injury?: SortOrderInput | SortOrder
    versus_team_score_data?: SortOrderInput | SortOrder
    retire_flg?: SortOrderInput | SortOrder
    deadline?: SortOrderInput | SortOrder
    deadline_contract_date?: SortOrderInput | SortOrder
    latest_info_date?: SortOrderInput | SortOrder
    upd_stamp?: SortOrderInput | SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
    _count?: team_member_masterCountOrderByAggregateInput
    _avg?: team_member_masterAvgOrderByAggregateInput
    _max?: team_member_masterMaxOrderByAggregateInput
    _min?: team_member_masterMinOrderByAggregateInput
    _sum?: team_member_masterSumOrderByAggregateInput
  }

  export type team_member_masterScalarWhereWithAggregatesInput = {
    AND?: team_member_masterScalarWhereWithAggregatesInput | team_member_masterScalarWhereWithAggregatesInput[]
    OR?: team_member_masterScalarWhereWithAggregatesInput[]
    NOT?: team_member_masterScalarWhereWithAggregatesInput | team_member_masterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"team_member_master"> | number
    country?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    league?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    team?: StringWithAggregatesFilter<"team_member_master"> | string
    score?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    loan_belong?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    jersey?: StringWithAggregatesFilter<"team_member_master"> | string
    member?: StringWithAggregatesFilter<"team_member_master"> | string
    face_pic_path?: StringWithAggregatesFilter<"team_member_master"> | string
    belong_list?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    height?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    weight?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    position?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    birth?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    age?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    market_value?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    injury?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    versus_team_score_data?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    retire_flg?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    deadline?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    deadline_contract_date?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    latest_info_date?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    upd_stamp?: StringNullableWithAggregatesFilter<"team_member_master"> | string | null
    del_flg?: StringWithAggregatesFilter<"team_member_master"> | string
    register_id?: StringWithAggregatesFilter<"team_member_master"> | string
    register_time?: DateTimeWithAggregatesFilter<"team_member_master"> | Date | string
    update_id?: StringWithAggregatesFilter<"team_member_master"> | string
    update_time?: DateTimeWithAggregatesFilter<"team_member_master"> | Date | string
  }

  export type country_league_masterWhereInput = {
    AND?: country_league_masterWhereInput | country_league_masterWhereInput[]
    OR?: country_league_masterWhereInput[]
    NOT?: country_league_masterWhereInput | country_league_masterWhereInput[]
    id?: IntFilter<"country_league_master"> | number
    country?: StringFilter<"country_league_master"> | string
    league?: StringFilter<"country_league_master"> | string
    team?: StringFilter<"country_league_master"> | string
    link?: StringFilter<"country_league_master"> | string
    del_flg?: StringFilter<"country_league_master"> | string
    register_id?: StringFilter<"country_league_master"> | string
    register_time?: DateTimeFilter<"country_league_master"> | Date | string
    update_id?: StringFilter<"country_league_master"> | string
    update_time?: DateTimeFilter<"country_league_master"> | Date | string
  }

  export type country_league_masterOrderByWithRelationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    link?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_masterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: country_league_masterWhereInput | country_league_masterWhereInput[]
    OR?: country_league_masterWhereInput[]
    NOT?: country_league_masterWhereInput | country_league_masterWhereInput[]
    country?: StringFilter<"country_league_master"> | string
    league?: StringFilter<"country_league_master"> | string
    team?: StringFilter<"country_league_master"> | string
    link?: StringFilter<"country_league_master"> | string
    del_flg?: StringFilter<"country_league_master"> | string
    register_id?: StringFilter<"country_league_master"> | string
    register_time?: DateTimeFilter<"country_league_master"> | Date | string
    update_id?: StringFilter<"country_league_master"> | string
    update_time?: DateTimeFilter<"country_league_master"> | Date | string
  }, "id">

  export type country_league_masterOrderByWithAggregationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    link?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
    _count?: country_league_masterCountOrderByAggregateInput
    _avg?: country_league_masterAvgOrderByAggregateInput
    _max?: country_league_masterMaxOrderByAggregateInput
    _min?: country_league_masterMinOrderByAggregateInput
    _sum?: country_league_masterSumOrderByAggregateInput
  }

  export type country_league_masterScalarWhereWithAggregatesInput = {
    AND?: country_league_masterScalarWhereWithAggregatesInput | country_league_masterScalarWhereWithAggregatesInput[]
    OR?: country_league_masterScalarWhereWithAggregatesInput[]
    NOT?: country_league_masterScalarWhereWithAggregatesInput | country_league_masterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"country_league_master"> | number
    country?: StringWithAggregatesFilter<"country_league_master"> | string
    league?: StringWithAggregatesFilter<"country_league_master"> | string
    team?: StringWithAggregatesFilter<"country_league_master"> | string
    link?: StringWithAggregatesFilter<"country_league_master"> | string
    del_flg?: StringWithAggregatesFilter<"country_league_master"> | string
    register_id?: StringWithAggregatesFilter<"country_league_master"> | string
    register_time?: DateTimeWithAggregatesFilter<"country_league_master"> | Date | string
    update_id?: StringWithAggregatesFilter<"country_league_master"> | string
    update_time?: DateTimeWithAggregatesFilter<"country_league_master"> | Date | string
  }

  export type country_league_season_masterWhereInput = {
    AND?: country_league_season_masterWhereInput | country_league_season_masterWhereInput[]
    OR?: country_league_season_masterWhereInput[]
    NOT?: country_league_season_masterWhereInput | country_league_season_masterWhereInput[]
    id?: IntFilter<"country_league_season_master"> | number
    country?: StringFilter<"country_league_season_master"> | string
    league?: StringFilter<"country_league_season_master"> | string
    season_year?: StringFilter<"country_league_season_master"> | string
    start_season_date?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    end_season_date?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    round?: StringNullableFilter<"country_league_season_master"> | string | null
    path?: StringNullableFilter<"country_league_season_master"> | string | null
    icon?: StringNullableFilter<"country_league_season_master"> | string | null
    valid_flg?: StringFilter<"country_league_season_master"> | string
    del_flg?: StringFilter<"country_league_season_master"> | string
    register_id?: StringNullableFilter<"country_league_season_master"> | string | null
    register_time?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    update_id?: StringNullableFilter<"country_league_season_master"> | string | null
    update_time?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
  }

  export type country_league_season_masterOrderByWithRelationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    season_year?: SortOrder
    start_season_date?: SortOrderInput | SortOrder
    end_season_date?: SortOrderInput | SortOrder
    round?: SortOrderInput | SortOrder
    path?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    valid_flg?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
  }

  export type country_league_season_masterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: country_league_season_masterWhereInput | country_league_season_masterWhereInput[]
    OR?: country_league_season_masterWhereInput[]
    NOT?: country_league_season_masterWhereInput | country_league_season_masterWhereInput[]
    country?: StringFilter<"country_league_season_master"> | string
    league?: StringFilter<"country_league_season_master"> | string
    season_year?: StringFilter<"country_league_season_master"> | string
    start_season_date?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    end_season_date?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    round?: StringNullableFilter<"country_league_season_master"> | string | null
    path?: StringNullableFilter<"country_league_season_master"> | string | null
    icon?: StringNullableFilter<"country_league_season_master"> | string | null
    valid_flg?: StringFilter<"country_league_season_master"> | string
    del_flg?: StringFilter<"country_league_season_master"> | string
    register_id?: StringNullableFilter<"country_league_season_master"> | string | null
    register_time?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
    update_id?: StringNullableFilter<"country_league_season_master"> | string | null
    update_time?: DateTimeNullableFilter<"country_league_season_master"> | Date | string | null
  }, "id">

  export type country_league_season_masterOrderByWithAggregationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    season_year?: SortOrder
    start_season_date?: SortOrderInput | SortOrder
    end_season_date?: SortOrderInput | SortOrder
    round?: SortOrderInput | SortOrder
    path?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    valid_flg?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
    _count?: country_league_season_masterCountOrderByAggregateInput
    _avg?: country_league_season_masterAvgOrderByAggregateInput
    _max?: country_league_season_masterMaxOrderByAggregateInput
    _min?: country_league_season_masterMinOrderByAggregateInput
    _sum?: country_league_season_masterSumOrderByAggregateInput
  }

  export type country_league_season_masterScalarWhereWithAggregatesInput = {
    AND?: country_league_season_masterScalarWhereWithAggregatesInput | country_league_season_masterScalarWhereWithAggregatesInput[]
    OR?: country_league_season_masterScalarWhereWithAggregatesInput[]
    NOT?: country_league_season_masterScalarWhereWithAggregatesInput | country_league_season_masterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"country_league_season_master"> | number
    country?: StringWithAggregatesFilter<"country_league_season_master"> | string
    league?: StringWithAggregatesFilter<"country_league_season_master"> | string
    season_year?: StringWithAggregatesFilter<"country_league_season_master"> | string
    start_season_date?: DateTimeNullableWithAggregatesFilter<"country_league_season_master"> | Date | string | null
    end_season_date?: DateTimeNullableWithAggregatesFilter<"country_league_season_master"> | Date | string | null
    round?: StringNullableWithAggregatesFilter<"country_league_season_master"> | string | null
    path?: StringNullableWithAggregatesFilter<"country_league_season_master"> | string | null
    icon?: StringNullableWithAggregatesFilter<"country_league_season_master"> | string | null
    valid_flg?: StringWithAggregatesFilter<"country_league_season_master"> | string
    del_flg?: StringWithAggregatesFilter<"country_league_season_master"> | string
    register_id?: StringNullableWithAggregatesFilter<"country_league_season_master"> | string | null
    register_time?: DateTimeNullableWithAggregatesFilter<"country_league_season_master"> | Date | string | null
    update_id?: StringNullableWithAggregatesFilter<"country_league_season_master"> | string | null
    update_time?: DateTimeNullableWithAggregatesFilter<"country_league_season_master"> | Date | string | null
  }

  export type team_color_masterWhereInput = {
    AND?: team_color_masterWhereInput | team_color_masterWhereInput[]
    OR?: team_color_masterWhereInput[]
    NOT?: team_color_masterWhereInput | team_color_masterWhereInput[]
    id?: IntFilter<"team_color_master"> | number
    country?: StringFilter<"team_color_master"> | string
    league?: StringFilter<"team_color_master"> | string
    team?: StringFilter<"team_color_master"> | string
    team_color_hex?: StringNullableFilter<"team_color_master"> | string | null
    register_id?: StringNullableFilter<"team_color_master"> | string | null
    register_time?: DateTimeNullableFilter<"team_color_master"> | Date | string | null
    update_id?: StringNullableFilter<"team_color_master"> | string | null
    update_time?: DateTimeNullableFilter<"team_color_master"> | Date | string | null
  }

  export type team_color_masterOrderByWithRelationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    team_color_hex?: SortOrderInput | SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
  }

  export type team_color_masterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: team_color_masterWhereInput | team_color_masterWhereInput[]
    OR?: team_color_masterWhereInput[]
    NOT?: team_color_masterWhereInput | team_color_masterWhereInput[]
    country?: StringFilter<"team_color_master"> | string
    league?: StringFilter<"team_color_master"> | string
    team?: StringFilter<"team_color_master"> | string
    team_color_hex?: StringNullableFilter<"team_color_master"> | string | null
    register_id?: StringNullableFilter<"team_color_master"> | string | null
    register_time?: DateTimeNullableFilter<"team_color_master"> | Date | string | null
    update_id?: StringNullableFilter<"team_color_master"> | string | null
    update_time?: DateTimeNullableFilter<"team_color_master"> | Date | string | null
  }, "id">

  export type team_color_masterOrderByWithAggregationInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    team_color_hex?: SortOrderInput | SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
    _count?: team_color_masterCountOrderByAggregateInput
    _avg?: team_color_masterAvgOrderByAggregateInput
    _max?: team_color_masterMaxOrderByAggregateInput
    _min?: team_color_masterMinOrderByAggregateInput
    _sum?: team_color_masterSumOrderByAggregateInput
  }

  export type team_color_masterScalarWhereWithAggregatesInput = {
    AND?: team_color_masterScalarWhereWithAggregatesInput | team_color_masterScalarWhereWithAggregatesInput[]
    OR?: team_color_masterScalarWhereWithAggregatesInput[]
    NOT?: team_color_masterScalarWhereWithAggregatesInput | team_color_masterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"team_color_master"> | number
    country?: StringWithAggregatesFilter<"team_color_master"> | string
    league?: StringWithAggregatesFilter<"team_color_master"> | string
    team?: StringWithAggregatesFilter<"team_color_master"> | string
    team_color_hex?: StringNullableWithAggregatesFilter<"team_color_master"> | string | null
    register_id?: StringNullableWithAggregatesFilter<"team_color_master"> | string | null
    register_time?: DateTimeNullableWithAggregatesFilter<"team_color_master"> | Date | string | null
    update_id?: StringNullableWithAggregatesFilter<"team_color_master"> | string | null
    update_time?: DateTimeNullableWithAggregatesFilter<"team_color_master"> | Date | string | null
  }

  export type future_masterWhereInput = {
    AND?: future_masterWhereInput | future_masterWhereInput[]
    OR?: future_masterWhereInput[]
    NOT?: future_masterWhereInput | future_masterWhereInput[]
    seq?: BigIntFilter<"future_master"> | bigint | number
    game_team_category?: StringFilter<"future_master"> | string
    future_time?: DateTimeFilter<"future_master"> | Date | string
    home_rank?: StringNullableFilter<"future_master"> | string | null
    away_rank?: StringNullableFilter<"future_master"> | string | null
    home_team_name?: StringNullableFilter<"future_master"> | string | null
    away_team_name?: StringNullableFilter<"future_master"> | string | null
    home_max_getting_scorer?: StringNullableFilter<"future_master"> | string | null
    away_max_getting_scorer?: StringNullableFilter<"future_master"> | string | null
    home_team_home_score?: StringNullableFilter<"future_master"> | string | null
    home_team_home_lost?: StringNullableFilter<"future_master"> | string | null
    away_team_home_score?: StringNullableFilter<"future_master"> | string | null
    away_team_home_lost?: StringNullableFilter<"future_master"> | string | null
    home_team_away_score?: StringNullableFilter<"future_master"> | string | null
    home_team_away_lost?: StringNullableFilter<"future_master"> | string | null
    away_team_away_score?: StringNullableFilter<"future_master"> | string | null
    away_team_away_lost?: StringNullableFilter<"future_master"> | string | null
    game_link?: StringNullableFilter<"future_master"> | string | null
    data_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
    start_flg?: StringFilter<"future_master"> | string
    register_id?: StringNullableFilter<"future_master"> | string | null
    register_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
    update_id?: StringNullableFilter<"future_master"> | string | null
    update_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
  }

  export type future_masterOrderByWithRelationInput = {
    seq?: SortOrder
    game_team_category?: SortOrder
    future_time?: SortOrder
    home_rank?: SortOrderInput | SortOrder
    away_rank?: SortOrderInput | SortOrder
    home_team_name?: SortOrderInput | SortOrder
    away_team_name?: SortOrderInput | SortOrder
    home_max_getting_scorer?: SortOrderInput | SortOrder
    away_max_getting_scorer?: SortOrderInput | SortOrder
    home_team_home_score?: SortOrderInput | SortOrder
    home_team_home_lost?: SortOrderInput | SortOrder
    away_team_home_score?: SortOrderInput | SortOrder
    away_team_home_lost?: SortOrderInput | SortOrder
    home_team_away_score?: SortOrderInput | SortOrder
    home_team_away_lost?: SortOrderInput | SortOrder
    away_team_away_score?: SortOrderInput | SortOrder
    away_team_away_lost?: SortOrderInput | SortOrder
    game_link?: SortOrderInput | SortOrder
    data_time?: SortOrderInput | SortOrder
    start_flg?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
  }

  export type future_masterWhereUniqueInput = Prisma.AtLeast<{
    seq?: bigint | number
    AND?: future_masterWhereInput | future_masterWhereInput[]
    OR?: future_masterWhereInput[]
    NOT?: future_masterWhereInput | future_masterWhereInput[]
    game_team_category?: StringFilter<"future_master"> | string
    future_time?: DateTimeFilter<"future_master"> | Date | string
    home_rank?: StringNullableFilter<"future_master"> | string | null
    away_rank?: StringNullableFilter<"future_master"> | string | null
    home_team_name?: StringNullableFilter<"future_master"> | string | null
    away_team_name?: StringNullableFilter<"future_master"> | string | null
    home_max_getting_scorer?: StringNullableFilter<"future_master"> | string | null
    away_max_getting_scorer?: StringNullableFilter<"future_master"> | string | null
    home_team_home_score?: StringNullableFilter<"future_master"> | string | null
    home_team_home_lost?: StringNullableFilter<"future_master"> | string | null
    away_team_home_score?: StringNullableFilter<"future_master"> | string | null
    away_team_home_lost?: StringNullableFilter<"future_master"> | string | null
    home_team_away_score?: StringNullableFilter<"future_master"> | string | null
    home_team_away_lost?: StringNullableFilter<"future_master"> | string | null
    away_team_away_score?: StringNullableFilter<"future_master"> | string | null
    away_team_away_lost?: StringNullableFilter<"future_master"> | string | null
    game_link?: StringNullableFilter<"future_master"> | string | null
    data_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
    start_flg?: StringFilter<"future_master"> | string
    register_id?: StringNullableFilter<"future_master"> | string | null
    register_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
    update_id?: StringNullableFilter<"future_master"> | string | null
    update_time?: DateTimeNullableFilter<"future_master"> | Date | string | null
  }, "seq">

  export type future_masterOrderByWithAggregationInput = {
    seq?: SortOrder
    game_team_category?: SortOrder
    future_time?: SortOrder
    home_rank?: SortOrderInput | SortOrder
    away_rank?: SortOrderInput | SortOrder
    home_team_name?: SortOrderInput | SortOrder
    away_team_name?: SortOrderInput | SortOrder
    home_max_getting_scorer?: SortOrderInput | SortOrder
    away_max_getting_scorer?: SortOrderInput | SortOrder
    home_team_home_score?: SortOrderInput | SortOrder
    home_team_home_lost?: SortOrderInput | SortOrder
    away_team_home_score?: SortOrderInput | SortOrder
    away_team_home_lost?: SortOrderInput | SortOrder
    home_team_away_score?: SortOrderInput | SortOrder
    home_team_away_lost?: SortOrderInput | SortOrder
    away_team_away_score?: SortOrderInput | SortOrder
    away_team_away_lost?: SortOrderInput | SortOrder
    game_link?: SortOrderInput | SortOrder
    data_time?: SortOrderInput | SortOrder
    start_flg?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
    _count?: future_masterCountOrderByAggregateInput
    _avg?: future_masterAvgOrderByAggregateInput
    _max?: future_masterMaxOrderByAggregateInput
    _min?: future_masterMinOrderByAggregateInput
    _sum?: future_masterSumOrderByAggregateInput
  }

  export type future_masterScalarWhereWithAggregatesInput = {
    AND?: future_masterScalarWhereWithAggregatesInput | future_masterScalarWhereWithAggregatesInput[]
    OR?: future_masterScalarWhereWithAggregatesInput[]
    NOT?: future_masterScalarWhereWithAggregatesInput | future_masterScalarWhereWithAggregatesInput[]
    seq?: BigIntWithAggregatesFilter<"future_master"> | bigint | number
    game_team_category?: StringWithAggregatesFilter<"future_master"> | string
    future_time?: DateTimeWithAggregatesFilter<"future_master"> | Date | string
    home_rank?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_rank?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_team_name?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_team_name?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_max_getting_scorer?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_max_getting_scorer?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_team_home_score?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_team_home_lost?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_team_home_score?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_team_home_lost?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_team_away_score?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    home_team_away_lost?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_team_away_score?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    away_team_away_lost?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    game_link?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    data_time?: DateTimeNullableWithAggregatesFilter<"future_master"> | Date | string | null
    start_flg?: StringWithAggregatesFilter<"future_master"> | string
    register_id?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    register_time?: DateTimeNullableWithAggregatesFilter<"future_master"> | Date | string | null
    update_id?: StringNullableWithAggregatesFilter<"future_master"> | string | null
    update_time?: DateTimeNullableWithAggregatesFilter<"future_master"> | Date | string | null
  }

  export type stat_size_finalize_masterWhereInput = {
    AND?: stat_size_finalize_masterWhereInput | stat_size_finalize_masterWhereInput[]
    OR?: stat_size_finalize_masterWhereInput[]
    NOT?: stat_size_finalize_masterWhereInput | stat_size_finalize_masterWhereInput[]
    id?: IntFilter<"stat_size_finalize_master"> | number
    option_num?: StringFilter<"stat_size_finalize_master"> | string
    options?: StringFilter<"stat_size_finalize_master"> | string
    flg?: StringFilter<"stat_size_finalize_master"> | string
    register_id?: StringFilter<"stat_size_finalize_master"> | string
    register_time?: DateTimeFilter<"stat_size_finalize_master"> | Date | string
    update_id?: StringFilter<"stat_size_finalize_master"> | string
    update_time?: DateTimeFilter<"stat_size_finalize_master"> | Date | string
  }

  export type stat_size_finalize_masterOrderByWithRelationInput = {
    id?: SortOrder
    option_num?: SortOrder
    options?: SortOrder
    flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type stat_size_finalize_masterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: stat_size_finalize_masterWhereInput | stat_size_finalize_masterWhereInput[]
    OR?: stat_size_finalize_masterWhereInput[]
    NOT?: stat_size_finalize_masterWhereInput | stat_size_finalize_masterWhereInput[]
    option_num?: StringFilter<"stat_size_finalize_master"> | string
    options?: StringFilter<"stat_size_finalize_master"> | string
    flg?: StringFilter<"stat_size_finalize_master"> | string
    register_id?: StringFilter<"stat_size_finalize_master"> | string
    register_time?: DateTimeFilter<"stat_size_finalize_master"> | Date | string
    update_id?: StringFilter<"stat_size_finalize_master"> | string
    update_time?: DateTimeFilter<"stat_size_finalize_master"> | Date | string
  }, "id">

  export type stat_size_finalize_masterOrderByWithAggregationInput = {
    id?: SortOrder
    option_num?: SortOrder
    options?: SortOrder
    flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
    _count?: stat_size_finalize_masterCountOrderByAggregateInput
    _avg?: stat_size_finalize_masterAvgOrderByAggregateInput
    _max?: stat_size_finalize_masterMaxOrderByAggregateInput
    _min?: stat_size_finalize_masterMinOrderByAggregateInput
    _sum?: stat_size_finalize_masterSumOrderByAggregateInput
  }

  export type stat_size_finalize_masterScalarWhereWithAggregatesInput = {
    AND?: stat_size_finalize_masterScalarWhereWithAggregatesInput | stat_size_finalize_masterScalarWhereWithAggregatesInput[]
    OR?: stat_size_finalize_masterScalarWhereWithAggregatesInput[]
    NOT?: stat_size_finalize_masterScalarWhereWithAggregatesInput | stat_size_finalize_masterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"stat_size_finalize_master"> | number
    option_num?: StringWithAggregatesFilter<"stat_size_finalize_master"> | string
    options?: StringWithAggregatesFilter<"stat_size_finalize_master"> | string
    flg?: StringWithAggregatesFilter<"stat_size_finalize_master"> | string
    register_id?: StringWithAggregatesFilter<"stat_size_finalize_master"> | string
    register_time?: DateTimeWithAggregatesFilter<"stat_size_finalize_master"> | Date | string
    update_id?: StringWithAggregatesFilter<"stat_size_finalize_master"> | string
    update_time?: DateTimeWithAggregatesFilter<"stat_size_finalize_master"> | Date | string
  }

  export type batch_job_execWhereInput = {
    AND?: batch_job_execWhereInput | batch_job_execWhereInput[]
    OR?: batch_job_execWhereInput[]
    NOT?: batch_job_execWhereInput | batch_job_execWhereInput[]
    job_id?: StringFilter<"batch_job_exec"> | string
    batch_cd?: StringFilter<"batch_job_exec"> | string
    status?: StringFilter<"batch_job_exec"> | string
    register_id?: StringNullableFilter<"batch_job_exec"> | string | null
    register_time?: DateTimeNullableFilter<"batch_job_exec"> | Date | string | null
    update_id?: StringNullableFilter<"batch_job_exec"> | string | null
    update_time?: DateTimeNullableFilter<"batch_job_exec"> | Date | string | null
  }

  export type batch_job_execOrderByWithRelationInput = {
    job_id?: SortOrder
    batch_cd?: SortOrder
    status?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
  }

  export type batch_job_execWhereUniqueInput = Prisma.AtLeast<{
    job_id?: string
    AND?: batch_job_execWhereInput | batch_job_execWhereInput[]
    OR?: batch_job_execWhereInput[]
    NOT?: batch_job_execWhereInput | batch_job_execWhereInput[]
    batch_cd?: StringFilter<"batch_job_exec"> | string
    status?: StringFilter<"batch_job_exec"> | string
    register_id?: StringNullableFilter<"batch_job_exec"> | string | null
    register_time?: DateTimeNullableFilter<"batch_job_exec"> | Date | string | null
    update_id?: StringNullableFilter<"batch_job_exec"> | string | null
    update_time?: DateTimeNullableFilter<"batch_job_exec"> | Date | string | null
  }, "job_id">

  export type batch_job_execOrderByWithAggregationInput = {
    job_id?: SortOrder
    batch_cd?: SortOrder
    status?: SortOrder
    register_id?: SortOrderInput | SortOrder
    register_time?: SortOrderInput | SortOrder
    update_id?: SortOrderInput | SortOrder
    update_time?: SortOrderInput | SortOrder
    _count?: batch_job_execCountOrderByAggregateInput
    _max?: batch_job_execMaxOrderByAggregateInput
    _min?: batch_job_execMinOrderByAggregateInput
  }

  export type batch_job_execScalarWhereWithAggregatesInput = {
    AND?: batch_job_execScalarWhereWithAggregatesInput | batch_job_execScalarWhereWithAggregatesInput[]
    OR?: batch_job_execScalarWhereWithAggregatesInput[]
    NOT?: batch_job_execScalarWhereWithAggregatesInput | batch_job_execScalarWhereWithAggregatesInput[]
    job_id?: StringWithAggregatesFilter<"batch_job_exec"> | string
    batch_cd?: StringWithAggregatesFilter<"batch_job_exec"> | string
    status?: StringWithAggregatesFilter<"batch_job_exec"> | string
    register_id?: StringNullableWithAggregatesFilter<"batch_job_exec"> | string | null
    register_time?: DateTimeNullableWithAggregatesFilter<"batch_job_exec"> | Date | string | null
    update_id?: StringNullableWithAggregatesFilter<"batch_job_exec"> | string | null
    update_time?: DateTimeNullableWithAggregatesFilter<"batch_job_exec"> | Date | string | null
  }

  export type team_member_masterCreateInput = {
    country?: string | null
    league?: string | null
    team: string
    score?: string | null
    loan_belong?: string | null
    jersey: string
    member: string
    face_pic_path: string
    belong_list?: string | null
    height?: string | null
    weight?: string | null
    position?: string | null
    birth?: string | null
    age?: string | null
    market_value?: string | null
    injury?: string | null
    versus_team_score_data?: string | null
    retire_flg?: string | null
    deadline?: string | null
    deadline_contract_date?: string | null
    latest_info_date?: string | null
    upd_stamp?: string | null
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type team_member_masterUncheckedCreateInput = {
    id?: number
    country?: string | null
    league?: string | null
    team: string
    score?: string | null
    loan_belong?: string | null
    jersey: string
    member: string
    face_pic_path: string
    belong_list?: string | null
    height?: string | null
    weight?: string | null
    position?: string | null
    birth?: string | null
    age?: string | null
    market_value?: string | null
    injury?: string | null
    versus_team_score_data?: string | null
    retire_flg?: string | null
    deadline?: string | null
    deadline_contract_date?: string | null
    latest_info_date?: string | null
    upd_stamp?: string | null
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type team_member_masterUpdateInput = {
    country?: NullableStringFieldUpdateOperationsInput | string | null
    league?: NullableStringFieldUpdateOperationsInput | string | null
    team?: StringFieldUpdateOperationsInput | string
    score?: NullableStringFieldUpdateOperationsInput | string | null
    loan_belong?: NullableStringFieldUpdateOperationsInput | string | null
    jersey?: StringFieldUpdateOperationsInput | string
    member?: StringFieldUpdateOperationsInput | string
    face_pic_path?: StringFieldUpdateOperationsInput | string
    belong_list?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
    birth?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    market_value?: NullableStringFieldUpdateOperationsInput | string | null
    injury?: NullableStringFieldUpdateOperationsInput | string | null
    versus_team_score_data?: NullableStringFieldUpdateOperationsInput | string | null
    retire_flg?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: NullableStringFieldUpdateOperationsInput | string | null
    deadline_contract_date?: NullableStringFieldUpdateOperationsInput | string | null
    latest_info_date?: NullableStringFieldUpdateOperationsInput | string | null
    upd_stamp?: NullableStringFieldUpdateOperationsInput | string | null
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type team_member_masterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: NullableStringFieldUpdateOperationsInput | string | null
    league?: NullableStringFieldUpdateOperationsInput | string | null
    team?: StringFieldUpdateOperationsInput | string
    score?: NullableStringFieldUpdateOperationsInput | string | null
    loan_belong?: NullableStringFieldUpdateOperationsInput | string | null
    jersey?: StringFieldUpdateOperationsInput | string
    member?: StringFieldUpdateOperationsInput | string
    face_pic_path?: StringFieldUpdateOperationsInput | string
    belong_list?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
    birth?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    market_value?: NullableStringFieldUpdateOperationsInput | string | null
    injury?: NullableStringFieldUpdateOperationsInput | string | null
    versus_team_score_data?: NullableStringFieldUpdateOperationsInput | string | null
    retire_flg?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: NullableStringFieldUpdateOperationsInput | string | null
    deadline_contract_date?: NullableStringFieldUpdateOperationsInput | string | null
    latest_info_date?: NullableStringFieldUpdateOperationsInput | string | null
    upd_stamp?: NullableStringFieldUpdateOperationsInput | string | null
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type team_member_masterCreateManyInput = {
    id?: number
    country?: string | null
    league?: string | null
    team: string
    score?: string | null
    loan_belong?: string | null
    jersey: string
    member: string
    face_pic_path: string
    belong_list?: string | null
    height?: string | null
    weight?: string | null
    position?: string | null
    birth?: string | null
    age?: string | null
    market_value?: string | null
    injury?: string | null
    versus_team_score_data?: string | null
    retire_flg?: string | null
    deadline?: string | null
    deadline_contract_date?: string | null
    latest_info_date?: string | null
    upd_stamp?: string | null
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type team_member_masterUpdateManyMutationInput = {
    country?: NullableStringFieldUpdateOperationsInput | string | null
    league?: NullableStringFieldUpdateOperationsInput | string | null
    team?: StringFieldUpdateOperationsInput | string
    score?: NullableStringFieldUpdateOperationsInput | string | null
    loan_belong?: NullableStringFieldUpdateOperationsInput | string | null
    jersey?: StringFieldUpdateOperationsInput | string
    member?: StringFieldUpdateOperationsInput | string
    face_pic_path?: StringFieldUpdateOperationsInput | string
    belong_list?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
    birth?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    market_value?: NullableStringFieldUpdateOperationsInput | string | null
    injury?: NullableStringFieldUpdateOperationsInput | string | null
    versus_team_score_data?: NullableStringFieldUpdateOperationsInput | string | null
    retire_flg?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: NullableStringFieldUpdateOperationsInput | string | null
    deadline_contract_date?: NullableStringFieldUpdateOperationsInput | string | null
    latest_info_date?: NullableStringFieldUpdateOperationsInput | string | null
    upd_stamp?: NullableStringFieldUpdateOperationsInput | string | null
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type team_member_masterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: NullableStringFieldUpdateOperationsInput | string | null
    league?: NullableStringFieldUpdateOperationsInput | string | null
    team?: StringFieldUpdateOperationsInput | string
    score?: NullableStringFieldUpdateOperationsInput | string | null
    loan_belong?: NullableStringFieldUpdateOperationsInput | string | null
    jersey?: StringFieldUpdateOperationsInput | string
    member?: StringFieldUpdateOperationsInput | string
    face_pic_path?: StringFieldUpdateOperationsInput | string
    belong_list?: NullableStringFieldUpdateOperationsInput | string | null
    height?: NullableStringFieldUpdateOperationsInput | string | null
    weight?: NullableStringFieldUpdateOperationsInput | string | null
    position?: NullableStringFieldUpdateOperationsInput | string | null
    birth?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    market_value?: NullableStringFieldUpdateOperationsInput | string | null
    injury?: NullableStringFieldUpdateOperationsInput | string | null
    versus_team_score_data?: NullableStringFieldUpdateOperationsInput | string | null
    retire_flg?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: NullableStringFieldUpdateOperationsInput | string | null
    deadline_contract_date?: NullableStringFieldUpdateOperationsInput | string | null
    latest_info_date?: NullableStringFieldUpdateOperationsInput | string | null
    upd_stamp?: NullableStringFieldUpdateOperationsInput | string | null
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type country_league_masterCreateInput = {
    country: string
    league: string
    team: string
    link: string
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type country_league_masterUncheckedCreateInput = {
    id?: number
    country: string
    league: string
    team: string
    link: string
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type country_league_masterUpdateInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type country_league_masterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type country_league_masterCreateManyInput = {
    id?: number
    country: string
    league: string
    team: string
    link: string
    del_flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type country_league_masterUpdateManyMutationInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type country_league_masterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    link?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type country_league_season_masterCreateInput = {
    country: string
    league: string
    season_year: string
    start_season_date?: Date | string | null
    end_season_date?: Date | string | null
    round?: string | null
    path?: string | null
    icon?: string | null
    valid_flg?: string
    del_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type country_league_season_masterUncheckedCreateInput = {
    id?: number
    country: string
    league: string
    season_year: string
    start_season_date?: Date | string | null
    end_season_date?: Date | string | null
    round?: string | null
    path?: string | null
    icon?: string | null
    valid_flg?: string
    del_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type country_league_season_masterUpdateInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    season_year?: StringFieldUpdateOperationsInput | string
    start_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    round?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    valid_flg?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type country_league_season_masterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    season_year?: StringFieldUpdateOperationsInput | string
    start_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    round?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    valid_flg?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type country_league_season_masterCreateManyInput = {
    id?: number
    country: string
    league: string
    season_year: string
    start_season_date?: Date | string | null
    end_season_date?: Date | string | null
    round?: string | null
    path?: string | null
    icon?: string | null
    valid_flg?: string
    del_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type country_league_season_masterUpdateManyMutationInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    season_year?: StringFieldUpdateOperationsInput | string
    start_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    round?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    valid_flg?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type country_league_season_masterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    season_year?: StringFieldUpdateOperationsInput | string
    start_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_season_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    round?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    valid_flg?: StringFieldUpdateOperationsInput | string
    del_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type team_color_masterCreateInput = {
    country: string
    league: string
    team: string
    team_color_hex?: string | null
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type team_color_masterUncheckedCreateInput = {
    id?: number
    country: string
    league: string
    team: string
    team_color_hex?: string | null
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type team_color_masterUpdateInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    team_color_hex?: NullableStringFieldUpdateOperationsInput | string | null
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type team_color_masterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    team_color_hex?: NullableStringFieldUpdateOperationsInput | string | null
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type team_color_masterCreateManyInput = {
    id?: number
    country: string
    league: string
    team: string
    team_color_hex?: string | null
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type team_color_masterUpdateManyMutationInput = {
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    team_color_hex?: NullableStringFieldUpdateOperationsInput | string | null
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type team_color_masterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    country?: StringFieldUpdateOperationsInput | string
    league?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    team_color_hex?: NullableStringFieldUpdateOperationsInput | string | null
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type future_masterCreateInput = {
    seq?: bigint | number
    game_team_category: string
    future_time: Date | string
    home_rank?: string | null
    away_rank?: string | null
    home_team_name?: string | null
    away_team_name?: string | null
    home_max_getting_scorer?: string | null
    away_max_getting_scorer?: string | null
    home_team_home_score?: string | null
    home_team_home_lost?: string | null
    away_team_home_score?: string | null
    away_team_home_lost?: string | null
    home_team_away_score?: string | null
    home_team_away_lost?: string | null
    away_team_away_score?: string | null
    away_team_away_lost?: string | null
    game_link?: string | null
    data_time?: Date | string | null
    start_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type future_masterUncheckedCreateInput = {
    seq?: bigint | number
    game_team_category: string
    future_time: Date | string
    home_rank?: string | null
    away_rank?: string | null
    home_team_name?: string | null
    away_team_name?: string | null
    home_max_getting_scorer?: string | null
    away_max_getting_scorer?: string | null
    home_team_home_score?: string | null
    home_team_home_lost?: string | null
    away_team_home_score?: string | null
    away_team_home_lost?: string | null
    home_team_away_score?: string | null
    home_team_away_lost?: string | null
    away_team_away_score?: string | null
    away_team_away_lost?: string | null
    game_link?: string | null
    data_time?: Date | string | null
    start_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type future_masterUpdateInput = {
    seq?: BigIntFieldUpdateOperationsInput | bigint | number
    game_team_category?: StringFieldUpdateOperationsInput | string
    future_time?: DateTimeFieldUpdateOperationsInput | Date | string
    home_rank?: NullableStringFieldUpdateOperationsInput | string | null
    away_rank?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    home_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    away_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    game_link?: NullableStringFieldUpdateOperationsInput | string | null
    data_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    start_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type future_masterUncheckedUpdateInput = {
    seq?: BigIntFieldUpdateOperationsInput | bigint | number
    game_team_category?: StringFieldUpdateOperationsInput | string
    future_time?: DateTimeFieldUpdateOperationsInput | Date | string
    home_rank?: NullableStringFieldUpdateOperationsInput | string | null
    away_rank?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    home_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    away_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    game_link?: NullableStringFieldUpdateOperationsInput | string | null
    data_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    start_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type future_masterCreateManyInput = {
    seq?: bigint | number
    game_team_category: string
    future_time: Date | string
    home_rank?: string | null
    away_rank?: string | null
    home_team_name?: string | null
    away_team_name?: string | null
    home_max_getting_scorer?: string | null
    away_max_getting_scorer?: string | null
    home_team_home_score?: string | null
    home_team_home_lost?: string | null
    away_team_home_score?: string | null
    away_team_home_lost?: string | null
    home_team_away_score?: string | null
    home_team_away_lost?: string | null
    away_team_away_score?: string | null
    away_team_away_lost?: string | null
    game_link?: string | null
    data_time?: Date | string | null
    start_flg?: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type future_masterUpdateManyMutationInput = {
    seq?: BigIntFieldUpdateOperationsInput | bigint | number
    game_team_category?: StringFieldUpdateOperationsInput | string
    future_time?: DateTimeFieldUpdateOperationsInput | Date | string
    home_rank?: NullableStringFieldUpdateOperationsInput | string | null
    away_rank?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    home_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    away_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    game_link?: NullableStringFieldUpdateOperationsInput | string | null
    data_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    start_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type future_masterUncheckedUpdateManyInput = {
    seq?: BigIntFieldUpdateOperationsInput | bigint | number
    game_team_category?: StringFieldUpdateOperationsInput | string
    future_time?: DateTimeFieldUpdateOperationsInput | Date | string
    home_rank?: NullableStringFieldUpdateOperationsInput | string | null
    away_rank?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_name?: NullableStringFieldUpdateOperationsInput | string | null
    home_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    away_max_getting_scorer?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_home_lost?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    home_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_score?: NullableStringFieldUpdateOperationsInput | string | null
    away_team_away_lost?: NullableStringFieldUpdateOperationsInput | string | null
    game_link?: NullableStringFieldUpdateOperationsInput | string | null
    data_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    start_flg?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type stat_size_finalize_masterCreateInput = {
    option_num?: string
    options: string
    flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type stat_size_finalize_masterUncheckedCreateInput = {
    id?: number
    option_num?: string
    options: string
    flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type stat_size_finalize_masterUpdateInput = {
    option_num?: StringFieldUpdateOperationsInput | string
    options?: StringFieldUpdateOperationsInput | string
    flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type stat_size_finalize_masterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    option_num?: StringFieldUpdateOperationsInput | string
    options?: StringFieldUpdateOperationsInput | string
    flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type stat_size_finalize_masterCreateManyInput = {
    id?: number
    option_num?: string
    options: string
    flg?: string
    register_id: string
    register_time: Date | string
    update_id: string
    update_time: Date | string
  }

  export type stat_size_finalize_masterUpdateManyMutationInput = {
    option_num?: StringFieldUpdateOperationsInput | string
    options?: StringFieldUpdateOperationsInput | string
    flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type stat_size_finalize_masterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    option_num?: StringFieldUpdateOperationsInput | string
    options?: StringFieldUpdateOperationsInput | string
    flg?: StringFieldUpdateOperationsInput | string
    register_id?: StringFieldUpdateOperationsInput | string
    register_time?: DateTimeFieldUpdateOperationsInput | Date | string
    update_id?: StringFieldUpdateOperationsInput | string
    update_time?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type batch_job_execCreateInput = {
    job_id: string
    batch_cd: string
    status: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type batch_job_execUncheckedCreateInput = {
    job_id: string
    batch_cd: string
    status: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type batch_job_execUpdateInput = {
    job_id?: StringFieldUpdateOperationsInput | string
    batch_cd?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type batch_job_execUncheckedUpdateInput = {
    job_id?: StringFieldUpdateOperationsInput | string
    batch_cd?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type batch_job_execCreateManyInput = {
    job_id: string
    batch_cd: string
    status: string
    register_id?: string | null
    register_time?: Date | string | null
    update_id?: string | null
    update_time?: Date | string | null
  }

  export type batch_job_execUpdateManyMutationInput = {
    job_id?: StringFieldUpdateOperationsInput | string
    batch_cd?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type batch_job_execUncheckedUpdateManyInput = {
    job_id?: StringFieldUpdateOperationsInput | string
    batch_cd?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    register_id?: NullableStringFieldUpdateOperationsInput | string | null
    register_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    update_id?: NullableStringFieldUpdateOperationsInput | string | null
    update_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type team_member_masterTeamJerseyMemberFace_pic_pathCompoundUniqueInput = {
    team: string
    jersey: string
    member: string
    face_pic_path: string
  }

  export type team_member_masterCountOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    score?: SortOrder
    loan_belong?: SortOrder
    jersey?: SortOrder
    member?: SortOrder
    face_pic_path?: SortOrder
    belong_list?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    position?: SortOrder
    birth?: SortOrder
    age?: SortOrder
    market_value?: SortOrder
    injury?: SortOrder
    versus_team_score_data?: SortOrder
    retire_flg?: SortOrder
    deadline?: SortOrder
    deadline_contract_date?: SortOrder
    latest_info_date?: SortOrder
    upd_stamp?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_member_masterAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type team_member_masterMaxOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    score?: SortOrder
    loan_belong?: SortOrder
    jersey?: SortOrder
    member?: SortOrder
    face_pic_path?: SortOrder
    belong_list?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    position?: SortOrder
    birth?: SortOrder
    age?: SortOrder
    market_value?: SortOrder
    injury?: SortOrder
    versus_team_score_data?: SortOrder
    retire_flg?: SortOrder
    deadline?: SortOrder
    deadline_contract_date?: SortOrder
    latest_info_date?: SortOrder
    upd_stamp?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_member_masterMinOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    score?: SortOrder
    loan_belong?: SortOrder
    jersey?: SortOrder
    member?: SortOrder
    face_pic_path?: SortOrder
    belong_list?: SortOrder
    height?: SortOrder
    weight?: SortOrder
    position?: SortOrder
    birth?: SortOrder
    age?: SortOrder
    market_value?: SortOrder
    injury?: SortOrder
    versus_team_score_data?: SortOrder
    retire_flg?: SortOrder
    deadline?: SortOrder
    deadline_contract_date?: SortOrder
    latest_info_date?: SortOrder
    upd_stamp?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_member_masterSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type country_league_masterCountOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    link?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_masterAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type country_league_masterMaxOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    link?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_masterMinOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    link?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_masterSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type country_league_season_masterCountOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    season_year?: SortOrder
    start_season_date?: SortOrder
    end_season_date?: SortOrder
    round?: SortOrder
    path?: SortOrder
    icon?: SortOrder
    valid_flg?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_season_masterAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type country_league_season_masterMaxOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    season_year?: SortOrder
    start_season_date?: SortOrder
    end_season_date?: SortOrder
    round?: SortOrder
    path?: SortOrder
    icon?: SortOrder
    valid_flg?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_season_masterMinOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    season_year?: SortOrder
    start_season_date?: SortOrder
    end_season_date?: SortOrder
    round?: SortOrder
    path?: SortOrder
    icon?: SortOrder
    valid_flg?: SortOrder
    del_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type country_league_season_masterSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type team_color_masterCountOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    team_color_hex?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_color_masterAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type team_color_masterMaxOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    team_color_hex?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_color_masterMinOrderByAggregateInput = {
    id?: SortOrder
    country?: SortOrder
    league?: SortOrder
    team?: SortOrder
    team_color_hex?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type team_color_masterSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type future_masterCountOrderByAggregateInput = {
    seq?: SortOrder
    game_team_category?: SortOrder
    future_time?: SortOrder
    home_rank?: SortOrder
    away_rank?: SortOrder
    home_team_name?: SortOrder
    away_team_name?: SortOrder
    home_max_getting_scorer?: SortOrder
    away_max_getting_scorer?: SortOrder
    home_team_home_score?: SortOrder
    home_team_home_lost?: SortOrder
    away_team_home_score?: SortOrder
    away_team_home_lost?: SortOrder
    home_team_away_score?: SortOrder
    home_team_away_lost?: SortOrder
    away_team_away_score?: SortOrder
    away_team_away_lost?: SortOrder
    game_link?: SortOrder
    data_time?: SortOrder
    start_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type future_masterAvgOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type future_masterMaxOrderByAggregateInput = {
    seq?: SortOrder
    game_team_category?: SortOrder
    future_time?: SortOrder
    home_rank?: SortOrder
    away_rank?: SortOrder
    home_team_name?: SortOrder
    away_team_name?: SortOrder
    home_max_getting_scorer?: SortOrder
    away_max_getting_scorer?: SortOrder
    home_team_home_score?: SortOrder
    home_team_home_lost?: SortOrder
    away_team_home_score?: SortOrder
    away_team_home_lost?: SortOrder
    home_team_away_score?: SortOrder
    home_team_away_lost?: SortOrder
    away_team_away_score?: SortOrder
    away_team_away_lost?: SortOrder
    game_link?: SortOrder
    data_time?: SortOrder
    start_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type future_masterMinOrderByAggregateInput = {
    seq?: SortOrder
    game_team_category?: SortOrder
    future_time?: SortOrder
    home_rank?: SortOrder
    away_rank?: SortOrder
    home_team_name?: SortOrder
    away_team_name?: SortOrder
    home_max_getting_scorer?: SortOrder
    away_max_getting_scorer?: SortOrder
    home_team_home_score?: SortOrder
    home_team_home_lost?: SortOrder
    away_team_home_score?: SortOrder
    away_team_home_lost?: SortOrder
    home_team_away_score?: SortOrder
    home_team_away_lost?: SortOrder
    away_team_away_score?: SortOrder
    away_team_away_lost?: SortOrder
    game_link?: SortOrder
    data_time?: SortOrder
    start_flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type future_masterSumOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type stat_size_finalize_masterCountOrderByAggregateInput = {
    id?: SortOrder
    option_num?: SortOrder
    options?: SortOrder
    flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type stat_size_finalize_masterAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type stat_size_finalize_masterMaxOrderByAggregateInput = {
    id?: SortOrder
    option_num?: SortOrder
    options?: SortOrder
    flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type stat_size_finalize_masterMinOrderByAggregateInput = {
    id?: SortOrder
    option_num?: SortOrder
    options?: SortOrder
    flg?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type stat_size_finalize_masterSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type batch_job_execCountOrderByAggregateInput = {
    job_id?: SortOrder
    batch_cd?: SortOrder
    status?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type batch_job_execMaxOrderByAggregateInput = {
    job_id?: SortOrder
    batch_cd?: SortOrder
    status?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type batch_job_execMinOrderByAggregateInput = {
    job_id?: SortOrder
    batch_cd?: SortOrder
    status?: SortOrder
    register_id?: SortOrder
    register_time?: SortOrder
    update_id?: SortOrder
    update_time?: SortOrder
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}