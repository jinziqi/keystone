var async = require('async');

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

	var tasks = [];

    var permission = {read:[],write:[]};
    if(req.list.permission && !req.user.isAdmin) {
        tasks.push(function(cb) {
            fields = [];

            keystone.list('Role').model.findById(req.user.role).exec(function(err, data) {
                var readPermission = data.readPermission ? data.readPermission.split('|') : [];
                var writePermission = data.writePermission ? data.writePermission.split('|') : [];
                for(key in req.list.fields) {
                    var field = req.list.fields[key];
                    if(readPermission.indexOf(field.label) > -1) {
                        fields.push(key);
                        permission.read.push(key);
                    }
                    if(writePermission.indexOf(field.label) > -1) {
                        permission.write.push(key);
                    }

                }
                cb();
            });

        });
    }


    async.parallel(tasks, function (err) {
        if (err) {
            return res.status(500).json({
                err: 'database error',
                detail: err,
            });
        }

        var ids = req.body.ids.split(',');

        var updated_vals = {};
        var fields = [];
        for(key in req.body) {
        	var field = req.body[key];
        	if(key==='ids')
        		continue;
        	if(!field)
        		continue;
        	if(req.list.permission && !req.user.isAdmin && permission.write.indexOf(key)===-1)
        		continue;
        	updated_vals[key] = field;
        	fields.push(key);
		}

        var filter = {
            _id:{$in: ids},

        };
        if(!req.user.isAdmin) {
        	filter.accessUsers = {$in: [req.user._id]};
		}

        var q = req.list.model.update(filter,updated_vals,{ multi: true, fields:fields});
        q.exec(function (err, result) {
            res.json({fields:req.body});
        });

    });


};
