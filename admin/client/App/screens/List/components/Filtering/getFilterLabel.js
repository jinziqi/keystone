import moment from 'moment';

const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD h:mm:ss';

function getFilterLabel (field, value) {
	const label = field.label;

	switch (field.type) {
		// BOOLEAN
		case 'boolean': {
			return value.value
				? label
				: `NOT ${label}`;
		}

		// DATE
		case 'date': {
			return `${label} ${resolveDateFormat(value, DATE_FORMAT)}`;
		}

		// DATE ARRAY
		case 'datearray': {
			const presence = value.presence === 'some' ? 'Some' : 'No';

			return `${presence} ${label} ${resolveDateFormat(value, DATETIME_FORMAT, 'are')}`;
		}

		// DATETIME
		case 'datetime': {
			return `${label} ${resolveDateFormat(value, DATETIME_FORMAT)}`;
		}

		// GEOPOINT
		// TODO distance needs a qualifier, currently defaults to "km"?
		case 'geopoint': {
			const mode = value.distance.mode === 'max' ? 'is within' : 'is at least';
			const distance = `${value.distance.value}km`;
			const conjunction = value.distance.mode === 'max' ? 'of' : 'from';
			const latlong = `${value.lat}, ${value.lon}`;

			return `${label} ${mode} ${distance} ${conjunction} ${latlong}`;
		}

		// LOCATION
		case 'location': {
			const joiner = value.inverted ? 'does NOT match' : 'matches';

			// Remove undefined values before rendering the template literal
			const formattedValue = [
				value.street,
				value.city,
				value.state,
				value.code,
				value.country,
			].join(' ').trim();

			return `${label} ${joiner} "${formattedValue}"`;
		}

		// NUMBER & MONEY
		case 'number':
		case 'money': {
			return `${label} ${resolveNumberFormat(value)}`;
		}

		// NUMBER ARRAY
		case 'numberarray': {
			const presence = value.presence === 'some' ? 'Some' : 'No';

			return `${presence} ${label} ${resolveNumberFormat(value, 'are')}`;
		}

		// PASSWORD
		case 'password': {
			return value.exists
				? `${label} is set`
				: `${label} is NOT set`;
		}

		// RELATIONSHIP
		// TODO populate relationship, currently rendering an ID
		case 'relationship': {
			let joiner = value.inverted ? 'is NOT' : 'is';
			let formattedValue = (value.value.length > 1)
				? value.value.join(', or ')
				: value.value[0];

			return `${label} ${joiner} ${formattedValue}`;
		}

		// SELECT
		case 'select': {
			let joiner = value.inverted ? 'is NOT' : 'is';
			let formattedValue = (value.value.length > 1)
				? value.value.join(', or ')
				: value.value[0];

			return `${label} ${joiner} ${formattedValue}`;
		}

		// TEXT-LIKE
		case 'code':
		case 'color':
		case 'email':
		case 'html':
		case 'key':
		case 'markdown':
		case 'name':
		case 'text':
		case 'textarea':
		case 'url': {
			let mode = '';
			if (value.mode === 'beginsWith') {
				mode = value.inverted ? 'does NOT begin with' : '开头是';
			} else if (value.mode === 'endsWith') {
				mode = value.inverted ? 'does NOT end with' : '结尾是';
			} else if (value.mode === 'exactly') {
				mode = value.inverted ? 'is NOT exactly' : '等于';
			} else if (value.mode === 'contains') {
				mode = value.inverted ? 'does NOT contain' : '包含';
			}

			return `${label} ${mode} "${value.value}"`;
		}

		// TEXTARRAY
		case 'textarray': {
			const presence = value.presence === 'some' ? 'Some' : 'No';
			let mode = '';
			if (value.mode === 'beginsWith') {
				mode = value.inverted ? 'do NOT begin with' : 'begin with';
			} else if (value.mode === 'endsWith') {
				mode = value.inverted ? 'do NOT end with' : 'end with';
			} else if (value.mode === 'exactly') {
				mode = value.inverted ? 'are NOT exactly' : 'are exactly';
			} else if (value.mode === 'contains') {
				mode = value.inverted ? 'do NOT contain' : 'contain';
			}

			return `${presence} ${label} ${mode} "${value.value}"`;
		}

		// CATCHALL
		default: {
			return `${label} "${value.value}"`;
		}
	}
};

function resolveNumberFormat (value, conjunction = 'is') {
	let mode = '';
	if (value.mode === 'equals') mode = conjunction;
	else if (value.mode === 'gt') mode = `${conjunction} 大于`;
	else if (value.mode === 'lt') mode = `${conjunction} 小于`;

	const formattedValue = value.mode === 'between'
		? `在 ${value.value.min} 和 ${value.value.max} 之间`
		: value.value;

	return `${mode} ${formattedValue}`;
}

function resolveDateFormat (value, format, conjunction = 'is') {
	const joiner = value.inverted ? `${conjunction} NOT` : conjunction;
	const mode = value.mode === 'on' ? '' : value.mode;
	const formattedValue = value.mode === 'between'
		? `${moment(value.after).format(format)} 和 ${moment(value.before).format(format)}`
		: moment(value.value).format(format);

	return `${joiner} ${mode} ${formattedValue}`;
}

module.exports = getFilterLabel;
