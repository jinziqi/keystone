import moment from 'moment';
import DayPicker from 'react-day-picker';
import React from 'react';
import { findDOMNode } from 'react-dom';
import Popout from '../../admin/client/App/shared/Popout';
import { FormInput } from '../../admin/client/App/elemental';

let lastId = 0;

module.exports = React.createClass({
	displayName: 'DateInput',
	propTypes: {
		format: React.PropTypes.string,
		name: React.PropTypes.string,
		onChange: React.PropTypes.func.isRequired,
		path: React.PropTypes.string,
		value: React.PropTypes.string,
	},
	getDefaultProps () {
		return {
			format: 'YYYY-MM-DD',
		};
	},
	getInitialState () {
		const id = ++lastId;
		let month = new Date();
		const { format, value } = this.props;
		if (moment(value, format, true).isValid()) {
			month = moment(value, format).toDate();
		}
		return {
			id: `_DateInput_${id}`,
			month: month,
			pickerIsOpen: false,
			inputValue: value,
		};
	},
	componentDidMount () {
		this.showCurrentMonth();
	},
	componentWillReceiveProps: function (newProps) {
		if (newProps.value === this.props.value) return;
		this.setState({
			month: moment(newProps.value, this.props.format).toDate(),
			inputValue: newProps.value,
		}, this.showCurrentMonth);
	},
	focus () {
		if (!this.refs.input) return;
		findDOMNode(this.refs.input).focus();
	},
	handleInputChange (e) {
		const { value } = e.target;
		this.setState({ inputValue: value }, this.showCurrentMonth);
	},
	handleKeyPress (e) {
		if (e.key === 'Enter') {
			e.preventDefault();
			// If the date is strictly equal to the format string, dispatch onChange
			if (moment(this.state.inputValue, this.props.format, true).isValid()) {
				this.props.onChange({ value: this.state.inputValue });
			// If the date is not strictly equal, only change the tab that is displayed
			} else if (moment(this.state.inputValue, this.props.format).isValid()) {
				this.setState({
					month: moment(this.state.inputValue, this.props.format).toDate(),
				}, this.showCurrentMonth);
			}
		}
	},
	handleDaySelect (e, date, modifiers) {
		if (modifiers && modifiers.disabled) return;

		var value = moment(date).format(this.props.format);

		this.props.onChange({ value });
		this.setState({
			pickerIsOpen: false,
			month: date,
			inputValue: value,
		});
	},
	showPicker () {
		this.setState({ pickerIsOpen: true }, this.showCurrentMonth);
	},
	showCurrentMonth () {
		if (!this.refs.picker) return;
		this.refs.picker.showMonth(this.state.month);
	},
	handleFocus (e) {
		if (this.state.pickerIsOpen) return;
		this.showPicker();
	},
	handleCancel () {
		this.setState({ pickerIsOpen: false });
	},
	handleBlur (e) {
		let rt = e.relatedTarget || e.nativeEvent.explicitOriginalTarget;
		const popout = this.refs.popout.getPortalDOMNode();
		while (rt) {
			if (rt === popout) return;
			rt = rt.parentNode;
		}
		this.setState({
			pickerIsOpen: false,
		});
	},
	render () {
		const selectedDay = this.props.value;
		// react-day-picker adds a class to the selected day based on this
		const modifiers = {
			selected: (day) => moment(day).format(this.props.format) === selectedDay,
		};

        const WEEKDAYS_LONG = {
            "zh": ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
        };
        const WEEKDAYS_SHORT = {
            "zh": ["一", "二", "三", "四", "五", "六", "日"]
        };

		const MONTHS = {
            "zh": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
        };

        const FIRST_DAY = {
            "zh": 1 // Use Monday as first day of the week
        };

        const localeUtils = {
            formatDay: (d, locale="en") => `${WEEKDAYS_LONG[locale][d.getDay()]}, ${d.getDate()} ${MONTHS[locale][d.getMonth()]} ${d.getFullYear()}`,
            formatMonthTitle: (d, locale) => `${d.getFullYear()}年 ${MONTHS[locale][d.getMonth()]}`,
            formatWeekdayShort: (i, locale) => WEEKDAYS_SHORT[locale][i],
            formatWeekdayLong: (i, locale) => WEEKDAYS_LONG[locale][i],
            getFirstDayOfWeek: (locale) => FIRST_DAY[locale]
        };

		return (
			<div>
				<FormInput
					autoComplete="off"
					id={this.state.id}
					name={this.props.name}
					onBlur={this.handleBlur}
					onChange={this.handleInputChange}
					onFocus={this.handleFocus}
					onKeyPress={this.handleKeyPress}
					placeholder={this.props.format}
					ref="input"
					value={this.state.inputValue}
				/>
				<Popout
					isOpen={this.state.pickerIsOpen}
					onCancel={this.handleCancel}
					ref="popout"
					relativeToID={this.state.id}
					width={260}
					>
					<DayPicker
						modifiers={modifiers}
						onDayClick={this.handleDaySelect}
						ref="picker"
						tabIndex={-1}
						locale="zh"
						localeUtils={ localeUtils }
					/>
				</Popout>
			</div>
		);
	},
});
