import emitter from '../emitter';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import moment from 'moment';

let viewSubscription, clickSubscription;

export default {
  async enable() {
    if (canUseDOM) {
      if (!('REACT_APP_DATAFLICK' in process.env)) {
        const error = new Error(
          "Dataflick A/B Testing Helper: 'REACT_APP_DATAFLICK' global is not defined."
        );
        error.type = 'PUSHTELL_HELPER_MISSING_GLOBAL';
        throw error;
      }
    }

    viewSubscription = emitter.addViewListener(async function (
      experimentName,
      variantName
    ) {
      const res = await fetch('http://ip-api.com/json');
      let data = await res.json();
      window.localStorage.setItem('country', data.country);

      let view = await fetch('https://dataflick.herokuapp.com/v1/view', {
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment: experimentName,
          variant: variantName,
          app: process.env.REACT_APP_DATAFLICK,
          url: window.location.href,
          view_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
          country: window.localStorage.getItem('country'),
        }),
      });

      view = await view.json();
      view = view.view;
      window.localStorage.setItem(variantName, view);
    });

    clickSubscription = emitter.addClickListener(async function (
      experimentName,
      variantName
    ) {
      await fetch('https://dataflick.herokuapp.com/v1/click', {
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          click_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
          view: parseInt(window.localStorage.getItem(variantName)),
        }),
      });
    });
  },
  disable() {
    if (canUseDOM) {
      if (!viewSubscription || !clickSubscription) {
        const error = new Error(
          'Dataflick A/B Testing Helper: Helper was not enabled.'
        );
        error.type = 'PUSHTELL_HELPER_INVALID_DISABLE';
        throw error;
      }
      viewSubscription.remove();
      clickSubscription.remove();
    }
  },
};
