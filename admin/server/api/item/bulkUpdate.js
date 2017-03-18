var async = require('async');

module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}

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

        updated_vals.updatedAt = new Date();
        updated_vals.updatedBy = req.user._id;

        if(!req.user.isAdmin) {
        	filter.accessUsers = {$in: [req.user._id]};
		}

        var q = req.list.model.update(filter,updated_vals,{ multi: true, fields:fields});
        q.exec(function (err, result) {
            res.json({fields:req.body});
        });

    });


};
