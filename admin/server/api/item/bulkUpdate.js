module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}
	/*
	req.list.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });
		if (!item) return res.status(404).json({ error: 'not found', id: req.params.id });
		req.list.updateItem(item, req.body, { files: req.files, user: req.user, fields:Object.keys(req.body) }, function (err) {
			if (err) {
				var status = err.error === 'validation errors' ? 400 : 500;
				var error = err.error === 'database error' ? err.detail : err;
				return res.apiError(status, error);
			}
			// Reload the item from the database to prevent save hooks or other
			// application specific logic from messing with the values in the item
			req.list.model.findById(req.params.id, function (err, updatedItem) {
				res.json(req.list.getData(updatedItem));
			});
		});
	});
	*/
	console.log(req.body);

	var ids = req.body.ids.split(',');
    res.json('success');
    var updated_vals = {};
    for(var key in locals.data.fields) {
        var field = locals.data.fields[key];

        if(req.body[key] && locals.role.write.indexOf(field.label) !== -1) {
            updated_vals[key] = req.body[key];
        }
    }

    var filter = {
    	_id:{$in, ids},
        accessUsers :  {$in: [locals.user._id]}
    };

    var q = req.list.model.update(filter,updated_vals,{ multi: true });
    q.exec(function (err, result) {
        res.json('success');
    });


};
