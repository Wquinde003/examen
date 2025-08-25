exports.success = function (req, res, data, status) {
    res.status(status || 200).send({ data: data, error: '' })
}

exports.error = function (req, res, data, status) {
    res.status(status || 500).send({ data: '', error: data })
}