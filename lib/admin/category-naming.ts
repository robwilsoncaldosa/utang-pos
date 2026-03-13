const CATEGORY_NAME_PATTERN = /^[A-Za-z0-9]+(?:[ -][A-Za-z0-9]+)*$/;

export function toCapitalCase(value: string) {
    return value
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(" ");
}

export function sanitizeCategoryName(value: string) {
    const normalized = value
        .replace(/[^A-Za-z0-9 -]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return toCapitalCase(normalized);
}

export function isValidCategoryName(value: string) {
    return CATEGORY_NAME_PATTERN.test(value);
}

export function validateCategoryName(value: string) {
    const normalized = sanitizeCategoryName(value);
    if (!normalized) {
        return { value: "", error: "Category name is required" };
    }
    if (!isValidCategoryName(normalized)) {
        return {
            value: normalized,
            error: "Use letters, numbers, spaces, and single hyphens only",
        };
    }
    return { value: normalized, error: null as string | null };
}
