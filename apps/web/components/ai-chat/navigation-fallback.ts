type RouterLike = {
    push: (href: string) => void;
};

/**
 * Some floating AI windows can be rendered across route boundaries.
 * We first try App Router navigation, then force hard navigation if URL did not change.
 */
export function pushRouteWithHardFallback(router: RouterLike, targetRoute?: string): void {
    const normalizedRoute = typeof targetRoute === 'string' ? targetRoute.trim() : '';
    if (!normalizedRoute) {
        return;
    }

    const hasWindow = typeof window !== 'undefined';
    const beforeHref = hasWindow ? window.location.href : '';

    router.push(normalizedRoute);

    if (!hasWindow || process.env.NODE_ENV === 'test') {
        return;
    }

    window.setTimeout(() => {
        if (window.location.href === beforeHref) {
            window.location.assign(normalizedRoute);
        }
    }, 250);
}
