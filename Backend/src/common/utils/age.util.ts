/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

/**
 * Check if age meets minimum requirement
 */
export function isAgeValid(dateOfBirth: Date, minAge: number = 13): boolean {
    const age = calculateAge(dateOfBirth);
    return age >= minAge;
}
