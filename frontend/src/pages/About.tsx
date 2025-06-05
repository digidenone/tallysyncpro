import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Info, 
  Users, 
  Code, 
  Zap, 
  Shield, 
  Database, 
  Download, 
  Star,
  Mail,
  Globe,
  Heart,
  Cpu,
  HardDrive,
  Monitor,
  Phone
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import MobileWarning from '@/components/MobileWarning';

const About = () => {
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <Download className="h-5 w-5" />,
      title: "Excel to Tally Integration",
      description: "Seamlessly import Excel data into Tally ERP with automatic validation"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Data Validation",
      description: "Advanced error detection and data integrity checks before import"
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Direct ODBC Connection",
      description: "Direct connection to Tally ERP 9 and Prime through ODBC"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Automated Processing",
      description: "Background sync and automated data processing capabilities"
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: "Modern Interface",
      description: "Clean, responsive design with dark/light theme support"
    },
    {
      icon: <Code className="h-5 w-5" />,
      title: "Template Generation",
      description: "Pre-formatted Excel templates for all major Tally voucher types"
    }
  ];  const developers = [
    { name: "Chirag Nahata" },
    { name: "Snigdha Ghosh" },
    { name: "Ariyan Bhattacharya" },
    { name: "Shamonnoy Halder" },
    { name: "Somyadip Ghosh" },
    { name: "Hitesh Roy" }
  ];

  const systemRequirements = [
    {
      icon: <Monitor className="h-4 w-4" />,
      requirement: "Windows 10/11 (64-bit)",
      description: "Operating System"
    },
    {
      icon: <Cpu className="h-4 w-4" />,
      requirement: "Intel Core i3 or AMD equivalent",
      description: "Processor"
    },
    {
      icon: <HardDrive className="h-4 w-4" />,
      requirement: "4 GB RAM minimum",
      description: "Memory"
    },
    {
      icon: <Database className="h-4 w-4" />,
      requirement: "Tally ERP 9",
      description: "Required Software"
    }
  ];

  return (
    <AppLayout>
      <MobileWarning />
      <div className="container-desktop-only spacing-desktop-section padding-desktop">
        {/* Header Section */}
        <motion.div 
          className="text-center space-y-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Info className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-desktop-xl font-bold gradient-heading">About TallySync Pro</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional Excel to Tally ERP integration software designed for seamless data management and automation
          </p>
        </motion.div>

        <motion.div 
          className="grid gap-6"
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Application Info */}
          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Application Information
                </CardTitle>
                <CardDescription>
                  Comprehensive details about TallySync Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">v1.0</div>
                    <div className="text-sm text-muted-foreground">Version</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">2025</div>
                    <div className="text-sm text-muted-foreground">Release Year</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Desktop</div>
                    <div className="text-sm text-muted-foreground">Platform</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">Electron</div>
                    <div className="text-sm text-muted-foreground">Framework</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features */}
          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  Key Features
                </CardTitle>
                <CardDescription>
                  Powerful tools and capabilities that make TallySync Pro essential for your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Requirements */}
          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-green-600" />
                  System Requirements
                </CardTitle>
                <CardDescription>
                  Minimum system specifications for optimal performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemRequirements.map((req, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                        {req.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{req.requirement}</div>
                        <div className="text-xs text-muted-foreground">{req.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Development Team */}          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Development Team
                </CardTitle>
                <CardDescription>
                  Meet the talented developers behind TallySync Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      D
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Digidenone</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">IT Solutions Company</p>
                      <p className="text-xs text-muted-foreground mt-1">Innovative software solutions for businesses</p>
                    </div>
                  </div>
                </div>
                  <div className="flex flex-wrap gap-4 justify-center">
                  {developers.map((dev, index) => (
                    <div 
                      key={index}
                      className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-16 w-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                        {dev.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                      <h4 className="font-medium text-sm text-center text-gray-900 dark:text-gray-100">{dev.name}</h4>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Technology Stack */}
          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  Technology Stack
                </CardTitle>
                <CardDescription>
                  Modern technologies powering TallySync Pro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Electron', 'React', 'TypeScript', 'Tailwind CSS', 
                    'Node.js', 'ODBC', 'SQLite', 'Framer Motion',
                    'Lucide Icons', 'Vite', 'ESLint', 'Prettier'
                  ].map((tech, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact & Support */}
          <motion.div variants={fadeInVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Contact & Support
                </CardTitle>
                <CardDescription>
                  Get in touch with our team for support and feedback
                </CardDescription>
              </CardHeader>              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Mail className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="font-medium">Email Support</span>
                    <span className="text-xs text-muted-foreground">digidenone@gmail.com</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Phone className="h-6 w-6 mb-2 text-green-600" />
                    <span className="font-medium">Phone Support</span>
                    <span className="text-xs text-muted-foreground">+917439611385</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Globe className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="font-medium">Website</span>
                    <span className="text-xs text-muted-foreground">digidenone.is-a.dev</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Copyright */}
          <motion.div variants={fadeInVariants}>            <div className="text-center py-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-muted-foreground">
                © 2025 Digidenone. All rights reserved. | TallySyncPro v1.0
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Made with <Heart className="h-3 w-3 inline text-red-500" /> for seamless business automation
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default About;
