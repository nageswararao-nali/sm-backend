export declare const REDIS_CLIENT = "REDIS_CLIENT";
export declare const RedisProvider: {
    provide: string;
    useFactory: () => import("ioredis/built/Redis").default;
};
