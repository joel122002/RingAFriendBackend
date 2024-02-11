function checkRegex(pattern, text) {
    let result = pattern.test(text);
    return result
}

export function usernameValidator(key, body) {
    // Username must contain at least [A-Za-z]|[0-9] and may contain [A-Za-z]|[0-9]|[_]|[\.]
    const usernameRegex = /^([A-Za-z]|[0-9]|[_]|[\.])*$/
    const usernameRegex2 = /([A-Za-z]|[0-9])+/
    if (!checkRegex(usernameRegex, body[key])) {
        return `${key} can only contain alphabets, digits, '.' and '_'`
    }
    if (!checkRegex(usernameRegex2, body[key])) {
        return `${key} must contain at least one alphabet or digit`
    }
    return true
}

export function emailValidator(key, body) {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    if (!checkRegex(emailRegex, body[key])) {
        return `${key} is not of valid format`
    }
    return true
}