/**
 * Contact Support Component
 * 
 * Provides multiple ways for users to get help and support
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, Phone, MessageSquare, Video, Clock, Send, 
  CheckCircle, AlertCircle, Coffee, Users, Headphones,
  ExternalLink, Download
} from 'lucide-react';
import { toast } from 'sonner';

const ContactSupport: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    priority: '',
    category: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate ticket submission
    toast.success('Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      priority: '',
      category: '',
      subject: '',
      message: ''
    });
  };

  const supportChannels = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@tallysyncpro.com',
      responseTime: '24 hours',
      availability: 'Available 24/7',
      action: () => window.open('mailto:support@tallysyncpro.com', '_blank')
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Live Chat',
      description: 'Instant chat with our support team',
      contact: 'Live Chat Widget',
      responseTime: '5 minutes',
      availability: 'Mon-Fri 9AM-6PM',
      action: () => toast.info('Live chat will be available soon!')
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      contact: '+1-800-TALLY-PRO',
      responseTime: 'Immediate',
      availability: 'Mon-Fri 9AM-6PM EST',
      action: () => window.open('tel:+18008255977', '_blank')
    },
    {
      icon: <Video className="h-6 w-6" />,
      title: 'Screen Share',
      description: 'Remote assistance and training',
      contact: 'Schedule a session',
      responseTime: 'Scheduled',
      availability: 'By appointment',
      action: () => toast.info('Screen share booking will be available soon!')
    }
  ];

  const quickHelp = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Connection Issues',
      description: 'Tally connection problems and setup help',
      action: () => toast.info('Opening connection troubleshooting guide...')
    },
    {
      icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
      title: 'Data Import Errors',
      description: 'Excel format and data validation issues',
      action: () => toast.info('Opening data import guide...')
    },
    {
      icon: <Coffee className="h-5 w-5 text-blue-500" />,
      title: 'Setup & Installation',
      description: 'Initial setup and configuration help',
      action: () => toast.info('Opening setup guide...')
    },
    {
      icon: <Users className="h-5 w-5 text-purple-500" />,
      title: 'Training & Onboarding',
      description: 'Team training and best practices',
      action: () => toast.info('Opening training resources...')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Channels */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Get Help</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
                      {channel.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{channel.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{channel.description}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {channel.responseTime}
                        </div>
                        <div className="text-xs text-gray-500">{channel.availability}</div>
                      </div>
                      <Button 
                        size="sm" 
                        className="mt-3 w-full text-xs"
                        onClick={channel.action}
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Help */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Help</h3>
          <div className="space-y-3">
            {quickHelp.map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={item.action}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Support Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Submit Support Ticket
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Submit a detailed support request and our team will help you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your company name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="setup">Setup & Installation</SelectItem>
                  <SelectItem value="data">Data Import Problem</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="billing">Billing & Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief description of your issue"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              rows={6}
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Please provide detailed information about your issue, including steps to reproduce, error messages, and any relevant context..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-xs text-gray-500">
              * Required fields. We typically respond within 24 hours.
            </div>
            <Button onClick={handleSubmitTicket}>
              <Send className="h-4 w-4 mr-2" />
              Submit Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            More ways to get help and stay updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Download className="h-5 w-5" />
              <span className="text-sm">Download User Manual</span>
              <span className="text-xs text-gray-500">Complete PDF guide</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Video className="h-5 w-5" />
              <span className="text-sm">Video Tutorials</span>
              <span className="text-xs text-gray-500">Step-by-step videos</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">Community Forum</span>
              <span className="text-xs text-gray-500">User discussions</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactSupport;
