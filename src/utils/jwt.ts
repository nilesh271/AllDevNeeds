export const decodeJWT = (token) => {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT structure");
    const decode = (str) => {
        const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(padded));
    };
    return {
        header: decode(parts[0]),
        payload: decode(parts[1]),
        signature: parts[2],
    };
}

export const getJWTExpiry = (payload) => {
    if (!payload.exp) return null;
    const date = new Date(payload.exp * 1000);
    const now = new Date();
    const expired = date < now;
    return { date, expired };
}