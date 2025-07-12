/**
 * GST Calculator Component
 * 
 * Provides automatic GST calculations for the new template structure
 * Handles 5%, 12%, and 18% GST rates with CGST and SGST calculations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GSTCalculation {
  amount5: number;
  amount12: number;
  amount18: number;
  cgst: number;
  sgst: number;
  total: number;
}

interface GSTCalculatorProps {
  onCalculationChange?: (calculation: GSTCalculation) => void;
  initialValues?: Partial<GSTCalculation>;
  templateType?: 'sales' | 'purchase';
}

export function GSTCalculator({ onCalculationChange, initialValues, templateType = 'purchase' }: GSTCalculatorProps) {
  const [values, setValues] = useState<GSTCalculation>({
    amount5: 0,
    amount12: 0,
    amount18: 0,
    cgst: 0,
    sgst: 0,
    total: 0,
    ...initialValues
  });

  const [autoCalculate, setAutoCalculate] = useState(true);

  // Calculate GST automatically when purchase amounts change
  useEffect(() => {
    if (autoCalculate) {
      calculateGST();
    }
  }, [values.amount5, values.amount12, values.amount18, autoCalculate]);

  const calculateGST = () => {
    const { amount5, amount12, amount18 } = values;
    
    // Calculate GST for each slab
    const gst5 = amount5 * 0.05;
    const gst12 = amount12 * 0.12;
    const gst18 = amount18 * 0.18;
    
    // Total GST
    const totalGST = gst5 + gst12 + gst18;
    
    // CGST and SGST are half of total GST each
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    
    // Total amount including GST
    const total = amount5 + amount12 + amount18 + totalGST;

    const newCalculation = {
      ...values,
      cgst,
      sgst,
      total
    };

    setValues(newCalculation);
    
    if (onCalculationChange) {
      onCalculationChange(newCalculation);
    }
  };

  const handleInputChange = (field: keyof GSTCalculation, value: string) => {
    const numValue = parseFloat(value) || 0;
    setValues(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const clearAll = () => {
    const cleared = {
      amount5: 0,
      amount12: 0,
      amount18: 0,
      cgst: 0,
      sgst: 0,
      total: 0
    };
    setValues(cleared);
    if (onCalculationChange) {
      onCalculationChange(cleared);
    }
  };

  // Get field labels based on template type
  const getFieldLabel = (rate: number) => {
    const baseLabel = templateType === 'sales' ? 'Sales' : 'Purchase';
    return `${baseLabel} ${rate}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>GST Calculator</span>
        </CardTitle>
        <CardDescription>
          Calculate GST amounts for different tax slabs. Works with both sales and purchase templates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Enter amounts for different GST rates. CGST and SGST will be calculated automatically.
          </AlertDescription>
        </Alert>

        {/* Purchase/Sales Amount Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount5">{getFieldLabel(5)} (₹)</Label>
            <Input
              id="amount5"
              type="number"
              step="0.01"
              value={values.amount5}
              onChange={(e) => handleInputChange('amount5', e.target.value)}
              placeholder="0.00"
            />
            <div className="text-xs text-muted-foreground">
              GST: ₹{(values.amount5 * 0.05).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount12">{getFieldLabel(12)} (₹)</Label>
            <Input
              id="amount12"
              type="number"
              step="0.01"
              value={values.amount12}
              onChange={(e) => handleInputChange('amount12', e.target.value)}
              placeholder="0.00"
            />
            <div className="text-xs text-muted-foreground">
              GST: ₹{(values.amount12 * 0.12).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount18">{getFieldLabel(18)} (₹)</Label>
            <Input
              id="amount18"
              type="number"
              step="0.01"
              value={values.amount18}
              onChange={(e) => handleInputChange('amount18', e.target.value)}
              placeholder="0.00"
            />
            <div className="text-xs text-muted-foreground">
              GST: ₹{(values.amount18 * 0.18).toFixed(2)}
            </div>
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="cgst">CGST (₹)</Label>
            <Input
              id="cgst"
              type="number"
              step="0.01"
              value={values.cgst.toFixed(2)}
              onChange={(e) => !autoCalculate && handleInputChange('cgst', e.target.value)}
              readOnly={autoCalculate}
              className={autoCalculate ? "bg-muted" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sgst">SGST (₹)</Label>
            <Input
              id="sgst"
              type="number"
              step="0.01"
              value={values.sgst.toFixed(2)}
              onChange={(e) => !autoCalculate && handleInputChange('sgst', e.target.value)}
              readOnly={autoCalculate}
              className={autoCalculate ? "bg-muted" : ""}
            />
          </div>
        </div>

        {/* Total Amount */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="total" className="text-lg font-semibold">TOTAL (₹)</Label>
          <Input
            id="total"
            type="number"
            step="0.01"
            value={values.total.toFixed(2)}
            onChange={(e) => !autoCalculate && handleInputChange('total', e.target.value)}
            readOnly={autoCalculate}
            className={`text-lg font-semibold ${autoCalculate ? "bg-muted" : ""}`}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoCalculate"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="autoCalculate" className="text-sm">
              Auto-calculate GST
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={calculateGST}>
              <Calculator className="h-4 w-4 mr-1" />
              Recalculate
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted rounded-lg p-4 mt-4">
          <h4 className="font-medium mb-2">Calculation Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Subtotal: ₹{(values.amount5 + values.amount12 + values.amount18).toFixed(2)}</div>
            <div>Total GST: ₹{(values.cgst + values.sgst).toFixed(2)}</div>
            <div>CGST (50%): ₹{values.cgst.toFixed(2)}</div>
            <div>SGST (50%): ₹{values.sgst.toFixed(2)}</div>
            <div className="col-span-2 font-semibold pt-2 border-t">
              Grand Total: ₹{values.total.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
