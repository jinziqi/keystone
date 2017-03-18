/*
TODO: Needs Review and Spec
*/

var moment = require('moment');
var assign = require('object-assign');
var XLSX = require('xlsx');

module.exports = function (req, res) {
	var baby = require('babyparse');
	var keystone = req.keystone;

	var format = req.params.format.split('.')[1]; // json or csv
	var where = {};
	var filters = req.query.filters;
	if (filters && typeof filters === 'string') {
		try { filters = JSON.parse(req.query.filters); }
		catch (e) { /* */ }
	}
	if (typeof filters === 'object') {
		assign(where, req.list.addFiltersToQuery(filters));
	}
	if (req.query.search) {
		assign(where, req.list.addSearchToQuery(req.query.search));
	}
    if (req.list.customFilter) {
        where = req.list.customFilter(where, req.user);
    }
	var query = req.list.model.find(where);
	if (req.query.populate) {
		query.populate(req.query.populate);
	}
	if (req.query.expandRelationshipFields) {
		req.list.relationshipFields.forEach(function (i) {
			query.populate(i.path);
		});
	}
	var sort = req.list.expandSort(req.query.sort);
	query.sort(sort.string);
	query.exec(function (err, results) {
		var data;
		var fields = [];
		if (err) return res.apiError('database error', err);
		if (format === 'xlsx') {
            var sheet_from_array_of_arrays = function(data, opts) {
                var ws = {};
                var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
                for(var R = 0; R != data.length; ++R) {
                    for(var C = 0; C != data[R].length; ++C) {
                        if(range.s.r > R) range.s.r = R;
                        if(range.s.c > C) range.s.c = C;
                        if(range.e.r < R) range.e.r = R;
                        if(range.e.c < C) range.e.c = C;
                        var cell = {v: data[R][C] };
                        if(cell.v == null) continue;
                        var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

						/* TEST: proper cell types and value handling */
                        if(typeof cell.v === 'number') cell.t = 'n';
                        else if(typeof cell.v === 'boolean') cell.t = 'b';
                        else if(cell.v instanceof Date) {
                            cell.t = 'n'; cell.z = XLSX.SSF._table[14];
                            cell.v = datenum(cell.v);
                        }
                        else cell.t = 's';
                        ws[cell_ref] = cell;
                    }
                }

				/* TEST: proper range */
                if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
                return ws;
            }

            var wb = {};
            wb.Sheets = {};
            wb.Props = {};
            wb.SSF = {};
            wb.SheetNames = [];

            data = results.map(function (item) {
				var row = req.list.getCSVData(item, {
					expandRelationshipFields: req.query.expandRelationshipFields,
					fields: req.query.select,
					user: req.user,
				});
				// If nested values in the first item aren't present, babyparse
				// won't add them even if they are present in others. So we
				// add keys from all items to an array and explicitly provided
				// the complete set to baby.unparse() below
				Object.keys(row).forEach(function (i) {
					if (fields.indexOf(i) === -1) fields.push(i);
				});
				return row;
			});

            var excelData = [fields];

          	for(var i in data) {
          		var row = [];
          		for(var f in fields) {
          			row.push(data[i][fields[f]]);
				}
				excelData.push(row);
			}

            var ws = sheet_from_array_of_arrays(excelData);
            var ws_name = "Sheet1";
            wb.SheetNames.push(ws_name);
            wb.Sheets[ws_name] = ws;
            var wbbuf = XLSX.write(wb, {
                type: 'base64'
            });


			res.attachment(req.list.path + '-' + moment().format('YYYYMMDD-HHMMSS') + '.xlsx');
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.end( new Buffer(wbbuf, 'base64') );
		} else {
			data = results.map(function (item) {
				return req.list.getData(item, req.query.select, req.query.expandRelationshipFields);
			});
			res.json(data);
		}
	});
};
