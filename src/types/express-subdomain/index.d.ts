type SubdomainCallback = (
    callback: (err: Error | null, allow?: boolean) => void
) => void;

type SubdomainPromise = (
    callback: (req: any, res: any, next: any) => void
) => void;

declare module 'express-subdomain' {
    function subdomain(
        prefix: string | undefined,
        callbackFn: SubdomainCallback
    ): SubdomainPromise;
    export = subdomain
}