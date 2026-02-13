import { toast } from 'react-toastify';
import './common.css';

export const ToastMessageWrapper = ({ type, title, message, className }) => {
  let titleClass = 'text-md';
  let messageTextClass = 'text-sm';

  switch (type) {
    case 'success':
      titleClass = titleClass + 'success-text';
      break;
    case 'error':
      titleClass = titleClass + ' danger-text';
      break;
    case 'warning':
      titleClass = titleClass + ' warning-text';
      break;
    default:
      titleClass = titleClass + '';
  }

  return (
    <div className={className}>
      {title && <h6 className={` ${titleClass}`}>{title}</h6>}
      {message && (
        <p
          className={messageTextClass}
          dangerouslySetInnerHTML={{ __html: message }}
        ></p>
      )}
    </div>
  );
};

export const ToastSuccessMessage = ({ title, message, options, redirect }) => {
  toast.success(
    <ToastMessageWrapper
      type="success"
      title={title}
      message={message}
      redirect={redirect}
    />,
    options,
  );
};

export const ToastErrorMessage = ({ title, message, options, redirect }) => {
  toast.error(
    <ToastMessageWrapper
      type="error"
      title={title}
      message={message}
      redirect={redirect}
    />,
    options,
  );
};

export const ToastWarningMessage = ({ title, message, options, redirect }) => {
  toast.warning(
    <ToastMessageWrapper
      type="warning"
      title={title}
      message={message}
      redirect={redirect}
    />,
    options,
  );
};

export const ToastMessage = ({ type, title, message, options, redirect }) => {
  switch (type) {
    case 'success':
      ToastSuccessMessage({ title, message, options, redirect });
      break;
    case 'error':
      ToastErrorMessage({ title, message, options, redirect });
      break;
    case 'warning':
      ToastWarningMessage({ title, message, options, redirect });
      break;
    default:
      toast(
        <ToastMessageWrapper
          title={title}
          message={message}
          redirect={redirect}
        />,
        {
          type,
          position: 'top-center',
          ...options,
        },
      );
  }
};
