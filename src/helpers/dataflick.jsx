import emitter from '../emitter';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import moment from 'moment';
import Cookie from 'universal-cookie';

let viewSubscription, clickSubscription;

export default {
  async enable() {
    const cookies = new Cookie();
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
      var visited = cookies.get('visited');

      //if it wasn't visited before
      if (
        typeof visited == 'undefined' ||
        visited.indexOf(
          window.location.href + ' ' + experimentName + ' ' + variantName
        ) == -1
      ) {
        if (typeof visited == 'undefined') visited = [];

        visited.push(
          window.location.href + ' ' + experimentName + ' ' + variantName
        );

        console.log('First visit, registering view:');
        console.log(visited);
        cookies.set('visited', visited, { path: '/', maxAge: 3600000 });

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
        //TODO make key unique between experiments
        window.localStorage.setItem(variantName, view);
      } else {
        console.log('Page already visited, skipping view');
      }
    });

    clickSubscription = emitter.addClickListener(async function (
      experimentName,
      variantName
    ) {
      var clicked = cookies.get('clicked');

      if (
        typeof clicked == 'undefined' ||
        clicked.indexOf(experimentName + ' ' + variantName) == -1
      ) {
        if (typeof clicked == 'undefined') clicked = [];

        clicked.push(experimentName + ' ' + variantName);
        console.log('First click, registering click:');
        console.log(clicked);
        cookies.set('clicked', clicked, { path: '/', maxAge: 3600000 });

        await fetch('https://dataflick.herokuapp.com/v1/click', {
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            click_date: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
            view: parseInt(window.localStorage.getItem(variantName)),
          }),
        }).then((res) => console.log('clicked'));
      } else {
        console.log('Variant already clicked, skipping click');
      }
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
