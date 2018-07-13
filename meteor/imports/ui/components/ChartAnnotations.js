import React, { Component } from 'react';
import { TwitterPicker as ColorPicker } from 'react-color';
import { updateAndSave, dataParse } from '../../modules/utils';
import { app_settings } from '../../modules/settings';
import { parse } from '../../modules/chart-tool';
import { timeFormat } from 'd3-time-format';
import Swal from 'sweetalert2';

export default class ChartAnnotations extends Component {

  constructor(props) {
    super(props);
    this.toggleCollapseExpand = this.toggleCollapseExpand.bind(this);
    this.toggleHighlightExpand = this.toggleHighlightExpand.bind(this);
    this.toggleTextExpand = this.toggleTextExpand.bind(this);
    this.toggleRangeExpand = this.toggleRangeExpand.bind(this);
    this.resetAnnotations = this.resetAnnotations.bind(this);
    this.removeHighlight = this.removeHighlight.bind(this);
    this.addRange = this.addRange.bind(this);
    this.setRangeConfig = this.setRangeConfig.bind(this);
    this.formatRangeValue = this.formatRangeValue.bind(this);
    this.renderRangeValueInput = this.renderRangeValueInput.bind(this);
    this.setRangeValue = this.setRangeValue.bind(this);
    this.state = {
      expanded: false,
      highlightExpanded: true,
      textExpanded: false,
      rangeExpanded: false
    };
  }

  expandStatus(category) {
    return this.state[category] ? 'expanded' : 'collapsed';
  }

  toggleCollapseExpand() {
    const expanded = !this.state.expanded;
    this.setState({ expanded });
    this.props.toggleAnnotationMode(expanded);
  }

  toggleHighlightExpand() {
    const highlightExpanded = !this.state.highlightExpanded;
    if (highlightExpanded) {
      this.setState({ textExpanded: false, rangeExpanded: false });
      this.props.handleCurrentAnnotation('type', 'highlight');
    }
    this.setState({ highlightExpanded });
  }

  toggleTextExpand() {
    const textExpanded = !this.state.textExpanded;
    const modObj = {};
    if (textExpanded) {
      modObj.highlightExpanded = false;
      modObj.rangeExpanded = false;
      this.props.handleCurrentAnnotation('type', 'text');
    }
    modObj.textExpanded = textExpanded;
    this.setState(modObj);
  }

  toggleRangeExpand() {
    const rangeExpanded = !this.state.rangeExpanded;
    if (rangeExpanded) {
      this.setState({ highlightExpanded: false, textExpanded: false });
      this.props.handleCurrentAnnotation('type', 'range');
    }
    this.setState({ rangeExpanded });
  }

  displayHighlight() {
    const { data } = dataParse(this.props.chart.data);

    let needsDates;

    if (this.props.chart.options.type !== 'bar') {
      needsDates = this.props.chart.x_axis.scale === 'ordinal' ? undefined : this.props.chart.date_format;
    }

    let dataObj, error;

    try {
      dataObj = parse(data, needsDates, this.props.chart.options.indexed);
    } catch(e) {
      error = e;
    }

    if (error) return;

    if (this.props.chart.options.type === 'bar' || this.props.chart.options.type === 'column') {
      return dataObj.seriesAmount === 1;
    } else {
      return false;
    }
  }

  highlightColors() {
    if (app_settings) return app_settings.highlightOptions;
  }

  currentAnno(type) {
    const chart = this.props.chart;
    if (chart.annotations && chart.annotations[type] && chart.annotations[type].length) {
      return true;
    } else {
      return false;
    }
  }

  removeHighlight(event) {
    const key = event.target.value;
    const h = this.props.chart.annotations.highlight.filter(d => {
      if (d.key !== key) return d;
    });
    updateAndSave('charts.update.annotation.highlight', this.props.chart._id, h);
  }

  setRangeConfig(event) {
    this.props.handleCurrentAnnotation(event.target.name, event.target.value);
  }

  formatRangeValue(range) {
    const data = this.props.currentAnnotation[range];

    if (!data) return '';

    const axis = this.props.chart[`${this.props.currentAnnotation.rangeAxis}_axis`];

    if (axis.scale === 'time' || axis.scale === 'ordinal-time') {
      const formatTime = timeFormat(this.props.chart.date_format);
      return formatTime(data);
    } else {

      // if it's direct input, let it be whatever the user wants
      if (event.type === 'input') return data;

      const rangeFormatting = {
        comma: 100,
        general: 100,
        round1: 10,
        round2: 100,
        round3: 1000,
        round4: 10000,
      };

      return Math.round(Number(data) * rangeFormatting[axis.format]) / rangeFormatting[axis.format];
    }
  }

  setRangeValue(event) {
    // need to add the reverse capability, to change displayed range based on input
    this.props.handleCurrentAnnotation(event.target.id, event.target.value);
  }

  renderRangeValueInput(type) {

    const rangeAxis = this.props.currentAnnotation.rangeAxis,
      rangeType = this.props.currentAnnotation.rangeType,
      scaleType = this.props.chart[`${rangeAxis}_axis`].scale,
      labelText = type === 'rangeStart' ? 'Start' : 'End (optional)';

    return (
      <div className={`range-row-item ${rangeType === 'line' && type === 'rangeEnd' ? 'muted' : ''}`}>
        <label
          className={`range-value ${scaleType === 'linear' ? 'editable' : ''}`}
          htmlFor={type}>{labelText}</label>
        <input
          id={type}
          className={`range-value ${scaleType === 'linear' ? 'editable' : ''}`}
          value={this.formatRangeValue(type)}
          onChange={this.setRangeValue}
        />
      </div>
    );

  }

  addRange() {
    const data = {
      axis: this.props.currentAnnotation.rangeAxis,
      start: this.props.currentAnnotation.rangeStart.toString(),
      end: this.props.currentAnnotation.rangeEnd.toString()
    };
    const range = this.props.chart.annotations.range || [];
    range.push(data);
    updateAndSave('charts.update.annotation.range', this.props.chart._id, range);
    this.props.handleCurrentAnnotation(['rangeStart', 'rangeEnd'], ['', '']);
  }

  resetAnnotations() {
    updateAndSave('charts.update.annotation.reset', this.props.chart._id);
  }

  helpHighlighting() {
    Swal({
      title: 'Highlighting?',
      text: "You can now highlight chosen bars and columns with a custom colour. Try it out by clicking on a colour, then clicking on the bar you'd like to recolour.",
      type: 'info'
    });
  }

  helpRanges() {
    Swal({
      title: 'Ranges?',
      text: 'You can click and drag on a chart to create a custom range annotation across the x- or y-axis.',
      type: 'info'
    });
  }

  helpText() {

  }

  render() {
    return (
      <div className='edit-box'>
        <h3 onClick={this.toggleCollapseExpand}>Annotations</h3>
        <div className={`unit-edit ${this.expandStatus('expanded')}`}>

          {this.props.annotationMode ?
            <p className='note'>Note: While the Annotation tab is open, previewed chart tips will be disabled.</p> : null
          }

          <div className='unit-edit unit-anno anno-highlight-edit'>
            <h4><span className='anno-subhed' onClick={this.toggleHighlightExpand}>Highlighting</span> <a onClick={this.helpHighlighting} className='help-toggle help-anno-higlight'>?</a></h4>
            {this.displayHighlight() ?
              <div className={`unit-annotation-expand ${this.expandStatus('highlightExpanded')}`}>
                <ColorPicker
                  triangle={'hide'}
                  colors={app_settings.highlightOptions}
                  onChangeComplete={this.props.handleHighlightColor}
                  color={this.props.currentAnnotation.highlight}
                  width={'100%'}
                  className={'color-picker'}
                />
                {this.currentAnno('highlight') ?
                  <div className='currently-highlighted'>
                    <p>Currently highlighted</p>
                    <ul>
                      {this.props.chart.annotations.highlight.map(d => {
                        const formatTime = timeFormat(this.props.chart.date_format);
                        let keyText = d.key;
                        if (this.props.chart.x_axis.scale === 'time' || this.props.chart.x_axis.scale === 'ordinal-time') {
                          keyText = formatTime(new Date(d.key));
                        }
                        return (
                          <li className='highlight-item' key={d.key}>
                            <div className='highlight-color' style={{ backgroundColor: d.color }}>
                              <button className='highlight-remove' value={d.key} onClick={this.removeHighlight}>&times;</button>
                            </div>
                            <div className='highlight-key'>{keyText}</div>
                          </li>
                        );
                      })}
                  </ul>
                  </div>
                : null }
              </div> : null }
          </div>

          <div className='unit-edit unit-anno anno-text-edit'>
            <h4><span className='anno-subhed' onClick={this.toggleRangeExpand}>Ranges</span> <a onClick={this.helpRanges} className='help-toggle help-anno-ranges'>?</a></h4>
            <div className={`unit-annotation-expand ${this.expandStatus('rangeExpanded')}`}>
              <div className='add-range'>
                <p className='note'>Select a start date (and optionally an end date) by filling in the fields below or clicking and dragging on the chart.</p>
                <div className='range-row'>
                  <div className='range-row-item'>
                    <label htmlFor='rangeAxis'>Range axis</label>
                    <div className='select-wrapper'>
                      <select
                        id='rangeAxis'
                        className='select-rangeaxis'
                        name='rangeAxis'
                        defaultValue={this.props.currentAnnotation.rangeAxis}
                        onChange={this.setRangeConfig}
                        >
                        {['x', 'y'].map(f => {
                          const str = `${f.toUpperCase()}-axis`;
                          return <option key={f} value={f}>{str}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                  <div className='range-row-item'>
                    <label htmlFor='rangeType'>Type</label>
                    <div className='select-wrapper'>
                      <select
                        id='rangeType'
                        className='select-rangetype'
                        name='rangeType'
                        defaultValue={this.props.currentAnnotation.rangeType}
                        onChange={this.setRangeConfig}
                      >
                        {['Area', 'Line'].map(f => {
                          return <option key={f} value={f.toLowerCase()}>{f}</option>;
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                <div className='range-row'>
                  { this.renderRangeValueInput('rangeStart') }
                  { this.renderRangeValueInput('rangeEnd') }
                </div>
                <button
                  className={this.props.currentAnnotation.rangeStart ? 'active' : ''}
                  onClick={this.addRange}
                >Add range</button>
              </div>

              {this.currentAnno('range') ?
                <div className='current-ranges'>
                  <p>Current ranges</p>
                  <ul>
                    {this.props.chart.annotations.range.map((d, i) => {
                      const axis = this.props.chart[`${d.axis}_axis`];
                      const data = {};
                      if (axis.scale === 'time' || axis.scale === 'ordinal-time') {
                        const formatTime = timeFormat(this.props.chart.date_format);
                        data.start = formatTime(d.start);
                        data.end = formatTime(d.end);
                      } else {
                        const rangeFormatting = {
                          comma: 100,
                          general: 100,
                          round1: 10,
                          round2: 100,
                          round3: 1000,
                          round4: 10000,
                        };
                        data.start = Math.round(Number(d.start) * rangeFormatting[axis.format]) / rangeFormatting[axis.format];
                        data.end = Math.round(Number(d.end) * rangeFormatting[axis.format]) / rangeFormatting[axis.format];
                      }
                      return (
                        <li className='range-item' key={i}>
                          <button className='range-remove' value={i} onClick={this.removeRange}>&times;</button>
                          <p>{d.axis}, {d.end ? 'Area' : 'Line'}</p>
                          <p>{d.start}</p>
                          <p>{d.end}</p>
                          {/* <div className='range' style={{ backgroundColor: d.color }}> */}

                          {/* </div> */}
                          {/* <div className='highlight-key'>{keyText}</div> */}
                        </li>
                      );
                    })}
                </ul>
                </div>
              : null }
            </div>
          </div>

          <div className='unit-edit anno-text-edit' style={{ opacity: 0.2 }}>
            <h4>Text annotations (coming soon) <a onClick={this.helpText} className='help-toggle help-anno-text'>?</a></h4>
            {/* Add point|area text
            Current text elements
            Alignment */}
          </div>

          <button className='annotation-reset' onClick={this.resetAnnotations}>Reset all annotations</button>

        </div>
      </div>
    );
  }

}
