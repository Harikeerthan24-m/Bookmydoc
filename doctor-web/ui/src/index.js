import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store/store';
import Loading from './components/common/Loading';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <React.Suspense fallback={<Loading type="overlay" text="Loading..." />}>
      <App />
    </React.Suspense>
  </Provider>,
);

reportWebVitals();
