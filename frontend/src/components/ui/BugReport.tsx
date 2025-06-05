/**
 * ================================================================
 * TallySyncPro - Bug Report Component
 * ================================================================
 * 
 * React component for collecting and submitting bug reports
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Textarea } from './textarea';
import { Badge } from './badge';
import LoadingAnimation from './LoadingAnimation';

interface BugReportData {
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'sync' | 'data' | 'performance' | 'other';
}

interface BugReportProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: BugReportData) => Promise<void>;
}

const BugReport: React.FC<BugReportProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<BugReportData>({
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'medium',
    category: 'other'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (field: keyof BugReportData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (action: 'email' | 'save') => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in the required fields (Title and Description)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {        // Use IPC to communicate with main process
        if ((window as any).electronAPI) {
          await (window as any).electronAPI.submitBugReport({ ...formData, action });
        }
      }
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit bug report:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      severity: 'medium',
      category: 'other'
    });
    setSubmitSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              🐛 Report a Bug
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Help us improve TallySyncPro by reporting any issues you encounter.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Bug Report Submitted Successfully!
              </h3>
              <p className="text-gray-600">
                Thank you for helping us improve TallySyncPro.
              </p>
            </div>
          ) : (
            <form className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bug Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Category and Severity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ui">User Interface</option>
                    <option value="sync">Data Synchronization</option>
                    <option value="data">Data Processing</option>
                    <option value="performance">Performance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Detailed description of the problem"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-24"
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Steps to Reproduce
                </label>
                <Textarea
                  placeholder="1. First step&#10;2. Second step&#10;3. Third step"
                  value={formData.stepsToReproduce}
                  onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                  className="w-full h-24"
                />
              </div>

              {/* Expected vs Actual Behavior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Behavior
                  </label>
                  <Textarea
                    placeholder="What should have happened?"
                    value={formData.expectedBehavior}
                    onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                    className="w-full h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Behavior
                  </label>
                  <Textarea
                    placeholder="What actually happened?"
                    value={formData.actualBehavior}
                    onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                    className="w-full h-20"
                  />
                </div>
              </div>

              {/* System Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-2">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <strong>System Information:</strong> Technical details about your system 
                    and application version will be automatically included to help with debugging.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => handleSubmit('email')}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <LoadingAnimation type="spinner" size="sm" color="primary" />
                  ) : (
                    <>📧 Send via Email</>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSubmit('save')}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <LoadingAnimation type="spinner" size="sm" color="secondary" />
                  ) : (
                    <>💾 Save to File</>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Quick bug report button component
export const BugReportButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={`text-red-600 border-red-200 hover:bg-red-50 ${className}`}
      >
        🐛 Report Bug
      </Button>
      
      <BugReport
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default BugReport;
