export function getEnv(name: string, defaultValue?: string): string {
    const value = process.env[name] || defaultValue;

    if (!value) {
        throw new Error(`Env variable ${name} is not defined.`);
    }

    return value;
}
