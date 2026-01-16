export const truncate = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export const fallback = (a, b) => {
    return !a || a.trim() === '' ? b : a;
}

export const bigNumber = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}