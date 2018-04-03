import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import Charts from '../../api/Charts/Charts';
import Chart from './Chart';
import { withTracker } from 'meteor/react-meteor-data';

class ChartPreview extends Component {

  constructor(props) {
    super(props);
    this.handleFieldChange = this.handleFieldChange.bind(this);
  }

  handleFieldChange(text, type) {
    Meteor.call(`charts.update.${type}`, this.props.match.params._id, text, err => {
      if (err) console.log(err);
    });
  }

  render() {
    return (
      <div className='chart-preview'>
        <div className='desktop-preview'>
          <h5>Desktop</h5>
          { !this.props.loading ?
            <Chart
              type={'desktop'}
              data={this.props.chart}
              editable={true}
              share_data={false}
              social={false}
              handleFieldChange={this.handleFieldChange}
            /> : null
          }
        </div>

        <div className='mobile-preview'>
          <h5>Mobile</h5>
          { !this.props.loading ?
            <Chart
              type={'mobile'}
              data={this.props.chart}
              editable={true}
              share_data={false}
              social={false}
              handleFieldChange={this.handleFieldChange}
            /> : null
          }
        </div>
      </div>
    );
  }

}

export default withTracker(props => {
  const subscription = Meteor.subscribe('chart', props.match.params._id);
  return {
    loading: !subscription.ready(),
    chart: Charts.findOne({ _id: props.match.params._id })
  };
})(ChartPreview);
