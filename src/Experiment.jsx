import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CoreExperiment from './CoreExperiment';
import emitter from './emitter';
import store from './store';

emitter.addActiveVariantListener(function (
  experimentName,
  variantName,
  skipSave
) {
  if (skipSave) {
    return;
  }
  store.setItem('PUSHTELL-' + experimentName, variantName);
});

export default class Experiment extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    defaultVariantName: PropTypes.string,
    userIdentifier: PropTypes.string,
    children: PropTypes.node,
  };

  static displayName = 'Pushtell.Experiment';

  click = () => {
    emitter.emitClick(this.props.name);
  };

  render() {
    return (
      <CoreExperiment {...this.props}>{this.props.children}</CoreExperiment>
    );
  }
}
