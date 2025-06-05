
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CustomToast = {
  success(message: string, options?: ToastOptions) {
    return toast.success(message, {
      ...options,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    });
  },
  
  error(message: string, options?: ToastOptions) {
    return toast.error(message, {
      ...options,
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    });
  },
  
  info(message: string, options?: ToastOptions) {
    return toast.info(message, {
      ...options,
      icon: <Info className="h-5 w-5 text-blue-500" />,
      className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    });
  },
  
  warning(message: string, options?: ToastOptions) {
    return toast(message, {
      ...options,
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    });
  },
  
  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, {
      ...options,
      className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    });
  },
  
  dismiss(toastId?: string) {
    toast.dismiss(toastId);
  },
};

export default CustomToast;
