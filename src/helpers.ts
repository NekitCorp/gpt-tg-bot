export function getEnv(name: string, defaultValue?: string): string {
    const value = process.env[name] || defaultValue;

    if (value === undefined) {
        throw new Error(`Env variable ${name} is not defined.`);
    }

    return value;
}

export function convertChatIdsString(value: string): number[] {
    return value.split(",").map((i) => Number(i));
}
