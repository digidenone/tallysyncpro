
import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple/20 to-teal-light/20 animate-pulse-subtle"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple to-teal-light flex items-center justify-center text-white text-4xl font-bold">
            !
          </div>
        </div>
        
        <h1 className="gradient-heading text-4xl mb-3">404</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
          Oops! Page not found
        </p>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Button asChild className="bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white">
          <Link to="/">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
