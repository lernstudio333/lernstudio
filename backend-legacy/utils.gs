function robustJsonParse(str) {
    var result;
    try {
        result = JSON.parse(str);
    } catch (e) {
        return "";
    }
    return result;
}

