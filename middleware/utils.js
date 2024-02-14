export function hasFields(keys) {
    return function (req, res, next) {
        const body = req.body;
        const absentKeys = [];
        keys.forEach((key) => {
            if (!body.hasOwnProperty(key)) {
                absentKeys.push(key);
            }
        });
        if (absentKeys.length > 0) {
            res.status(400);
            res.send({
                error: `Following fields missing in request body: ${absentKeys.join(
                    ', '
                )}`,
            });
            return;
        }
        next();
    };
}

export function validateKeys(keys, validators) {
    return function (req, res, next) {
        let hasError = false;
        keys.every((key, i) => {
            var response = validators[i](key, req.body);
            if (typeof response == 'boolean') {
                return true;
            } else {
                res.status(400);
                res.send({
                    error: response,
                });
                hasError = true;
                return false;
            }
        });
        if (hasError) return;
        next();
    };
}

export function isAuthenticated(req, res, next) {
    if (req?.user) {
        next();
    } else {
        return res.sendStatus(401);
    }
}

export function satisfiesBaseVersion(req, res, next) {
    var headers = req.headers;
	if (!headers.hasOwnProperty('version')) {
		res.status(400);
		return res.send({ error: "'version' header missing" });
	}
	var version = Number(headers.version);
	if (version < 1) {
		res.status(400);
		return res.send({ error: 'Update the app' });
	}
	next();
}
