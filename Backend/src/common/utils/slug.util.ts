/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate slug format
 * - Alphanumeric and hyphens only
 * - 3-50 characters
 * - No leading/trailing hyphens
 */
export function validateSlugFormat(slug: string): boolean {
    const slugRegex = /^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$/;
    return slugRegex.test(slug);
}

/**
 * Suggest alternative slug by appending number
 */
export function suggestAlternativeSlug(baseSlug: string, counter: number = 2): string {
    return `${baseSlug}-${counter}`;
}
