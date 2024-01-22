export function hasFields(keys) {
    return function (req, res, next) {
        const body = req.body
        const absentKeys = []
        keys.forEach((key) => {
            if (!body.hasOwnProperty(key)) {
                absentKeys.push(key)
            }
        })
        if (absentKeys.length > 0) {
            res.status(400);
            res.send({
                message: `Following fields missing in request body: ${absentKeys.join(', ')}`
            })
            return;
        }
        next()
    }
}
